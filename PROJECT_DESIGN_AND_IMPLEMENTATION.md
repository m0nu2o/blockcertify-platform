# BlockCertify — Project Design & Implementation Guide

This document explains **how BlockCertify works and why it's built this way**, in plain language. It's meant to be read by someone who owns this project but didn't write the code. For step-by-step instructions to actually run it, see `DEMO_GUIDE.md`. For a terser, more technical reference, see `docs/architecture.md` and `docs/api-overview.md`.

## 1. The problem this solves

Paper certificates and simple PDF diplomas can be forged, edited, or lost, and a third party (an employer, another university) has no easy way to check whether one is genuine without calling the issuing institution directly.

BlockCertify gives an issuing institution (a university, training provider, certification body) a way to:

1. Issue a certificate that is cryptographically fingerprinted and that fingerprint is permanently recorded on a blockchain.
2. Let *anyone* — with no account, no login — check in seconds whether a given certificate is genuine, unmodified, and not revoked, by comparing the certificate against that on-chain fingerprint.

The blockchain doesn't store the certificate itself (that would be slow and expensive). It stores a small, tamper-proof **fingerprint** of it. That distinction drives most of the design below.

## 2. The three moving parts

```
 Browser (client/)  <-->  API (server/)  <-->  MongoDB (business records)
                              |
                              +--> Local blockchain (contracts/) — fingerprints
                              |
                              +--> IPFS / Pinata, or local disk — file storage
```

- **`client/`** — the website. A Next.js app: the marketing pages, login/register, and three role-based dashboards (admin, institution, student), plus the public verification page.
- **`server/`** — the API. An Express.js app that holds all the business logic: who's allowed to do what, how a certificate gets issued, how verification is computed.
- **`contracts/`** — a single Solidity smart contract (`BlockCertifyRegistry.sol`) plus the tooling (Hardhat) to compile, test, and deploy it.
- **MongoDB** — the primary database. Certificates, users, institutions, students, notifications, settings, and audit logs all live here as normal database documents.
- **IPFS/Pinata (or local disk fallback)** — stores the actual certificate PDF file and a JSON metadata document, and returns a link/address for each. See section 6.

Why split it this way instead of putting everything on the blockchain? Blockchains are slow, small, and every write costs a fee ("gas"). They're the wrong place to store a multi-megabyte PDF or to run a fast search/filter/pagination query across thousands of certificates. So the blockchain is used *only* for the one thing it's uniquely good at: creating a fingerprint that nobody — not even BlockCertify itself — can quietly alter after the fact. Everything else (the actual data, search, dashboards, roles) lives in a normal database, which is fast, cheap, and flexible.

## 3. The data model (MongoDB)

| Collection | Purpose |
|---|---|
| `User` | Login identity for admin/institution/student accounts. Holds the hashed password and role. |
| `Institution` | An issuing organization. Linked to the `User` that manages it. Tracks issuance/revocation/student counts. |
| `Student` | A certificate holder's profile (name, degree, course, etc.), linked to an `Institution` and optionally to a `User` if the student has their own login. |
| `Certificate` | The certificate record: who it's for, what it's for, its file/metadata fingerprints, its blockchain transaction hash, its current status (`issued`, `verified`, `revoked`, `expired`), and verification statistics. |
| `BlockchainTransaction` | A log of every write the server made to the smart contract (issue/update/revoke), including gas used and the resulting transaction hash. Purely for auditability/analytics — the contract itself is the source of truth. |
| `Notification` | In-app notifications (e.g. "your certificate was issued"). |
| `AuditLog` | A record of privileged actions (who did what, when, from where) for compliance/traceability. |
| `Setting` | Platform-wide configuration (platform name, maintenance mode, etc.). |

Role-based access is enforced centrally in `server/src/utils/authorization.ts`: an admin can see everything; an institution can only see/modify certificates tied to its own `Institution` record; a student can only see certificates tied to their own student identity. Every certificate read/update/revoke route calls into this same authorization logic, so there's one place that decides "can this user touch this certificate," not one copy of that logic per route.

## 4. Issuing a certificate, step by step

This is the core workflow (`server/src/services/certificateService.ts`, function `issueCertificate`):

1. An institution submits the certificate form (student details) plus a PDF file.
2. The server finds or creates the `Student` record.
3. It generates a human-readable certificate ID (`BC-XXXXXXXX`).
4. It computes a **SHA-256 hash** of the PDF file's bytes (`fileHash`) and a separate hash of the certificate's metadata (`metadataHash`). A hash is a one-way fingerprint: the same input always produces the same output, but you can't reconstruct the input from the output, and changing even one byte of the input completely changes the output. This is what makes tampering detectable later.
5. It generates a QR code that encodes a verification URL for this certificate.
6. It stores the PDF and a metadata JSON document via the storage layer (IPFS/Pinata, or the local fallback — see section 6), getting back a content address (`cid`) and URL for each.
7. It calls `issueCertificate(...)` on the smart contract, writing `certificateId`, `metadataHash`, `fileHash`, and the metadata URL on-chain. This is the one and only step that touches the blockchain during issuance, and it costs gas (paid by the server's own wallet, not the institution's).
8. It saves the full `Certificate` document in MongoDB, including the on-chain transaction hash.
9. It logs a `BlockchainTransaction` row, updates the institution's stats, notifies the student (in-app and by email, if email is configured), and writes an audit log entry.

If any step fails, nothing partial is left issued — the certificate is only saved to MongoDB after the on-chain write succeeds, so MongoDB and the blockchain can't disagree about whether a given certificate was actually issued.

There's also a **bulk issuance** path (CSV upload) that runs the same logic per row, in small batches, and reports which rows succeeded or failed individually instead of stopping at the first error — useful for issuing an entire graduating class at once.

## 5. Verifying a certificate, step by step

This is deliberately the opposite of issuance in one important way: **verification never writes to the blockchain.** It only *reads* from it. Looking up whether a certificate is genuine should be free, instant, and available to literally anyone — a would-be employer shouldn't need a crypto wallet or have to pay a fee just to check a diploma.

`server/src/services/certificateService.ts`, function `verifyByCertificateId`:

1. Load the certificate record from MongoDB by its ID.
2. Call the smart contract's `getCertificate(...)` — a read-only ("view") function, meaning it costs no gas and doesn't create a transaction — to fetch what's actually recorded on-chain for that ID.
3. Compare: is the certificate revoked (either in MongoDB or on-chain)? Do the MongoDB `fileHash`/`metadataHash` match the on-chain ones exactly?
4. If everything matches and nothing is revoked, the certificate is valid.

The other three entry points (verify by file hash, by blockchain transaction hash, by QR code) all resolve to a certificate ID first, then call this same function — so there's exactly one verification algorithm, reused everywhere.

One nuance worth knowing: verification *does* update a couple of bookkeeping fields on the MongoDB record (`lastVerifiedAt`, a running `verificationCount`, and it flips status from `issued` to `verified` the first time). That's a normal database write, not a blockchain write — "verification is read-only" specifically means with respect to the blockchain (no gas spent, no transaction created, no contract state changed), not that MongoDB is untouched.

## 6. Where the actual files live (IPFS, Pinata, and the local fallback)

The blockchain only stores hashes and a URL — the actual PDF and its metadata have to live somewhere reachable by that URL. The normal answer is **IPFS** (a peer-to-peer file network) via **Pinata** (a hosted "pinning" service that keeps your files available on IPFS reliably). That's what `server/src/services/ipfsService.ts` does when a Pinata API key (`PINATA_JWT`) is configured.

Signing up for Pinata is one more step than a first-time demo really needs, so this project also includes a **local fallback**: when `PINATA_JWT` is left empty, the exact same files are written to this server's own disk (`server/uploads/ipfs-fallback/`) and served back over plain HTTP from a `/files` route the server exposes. The rest of the application — the certificate record, the verification logic, the UI — never needs to know or care which of the two happened; both paths return the same shape of data (`{ cid, url }`). This means you can demo the entire product with zero external accounts, and switch to real IPFS later just by adding a Pinata key to `server/.env` — no code changes required.

## 7. The smart contract

`contracts/contracts/BlockCertifyRegistry.sol` is intentionally small — a certificate registry, not a general-purpose app:

- `issueCertificate(id, metadataHash, fileHash, metadataUri)` — stores a new record. Fails if that ID already exists (no accidental overwrites).
- `updateCertificate(id, metadataHash, metadataUri)` — updates the metadata fingerprint for an existing, non-revoked certificate (e.g. correcting a typo in the course name after issuance).
- `revokeCertificate(id, reason)` — marks a certificate revoked, permanently, with a reason string.
- `getCertificate(id)` — a free, read-only lookup of everything stored for that ID. This is what powers verification.
- `verifyCertificate(id)` — a simpler read-only check that just returns whether the certificate exists and isn't revoked.

Only the contract's `owner` and any address the owner has explicitly authorized (`setIssuerAuthorization`) can issue/update/revoke. In this project, the server itself holds the key that's authorized to write, and end users never interact with the contract directly — they only ever go through the API, which enforces its own role checks (section 3) before ever calling the contract. So there are two layers of permission: "is this user allowed to do this, according to the API," and "is this wallet allowed to write, according to the contract" — the second layer is a safety net in case the contract is ever called from somewhere other than this API.

### Why a *local* test blockchain for the demo

Real blockchain networks (Ethereum mainnet, or even public test networks like Sepolia) require real or test cryptocurrency to pay gas, plus signing up for a node provider (Alchemy/Infura) to talk to them. None of that is needed to demonstrate how the *product* works. Hardhat ships with a local, single-machine blockchain that behaves like a real one but is free, instant, and resets whenever you restart it — perfect for development and demos, not appropriate for an actual production launch (see section 9).

## 8. Security model, briefly

- Passwords are hashed with bcrypt; the API never stores or returns plaintext passwords.
- The API issues its own short-lived JWT on login (separate from the frontend's own session cookie, which is handled by Auth.js/NextAuth) — every API request must present that JWT as a Bearer token.
- "Forgot password" always returns the same generic message regardless of whether the email exists, so the API can't be used to check who has an account.
- Certificate update requests use an allow-list (`degree`, `course`, `department`, `graduationYear`, `expiryDate`, `tags` only) and explicitly reject dangerous keys like `__proto__`, so a malicious request body can't inject unexpected fields.
- Public verification endpoints have a stricter rate limit than the rest of the API, since they're intentionally open to anyone.
- Every privileged action (issuing, updating, revoking, logging in) writes an audit log entry with the actor and a timestamp.

## 9. What would need to change for a real production launch

This project is built to demo cleanly and to be a solid foundation, but a few things are deliberately simplified for local development that you'd want to revisit before handling real institutions' data:

- Swap the local Hardhat blockchain for a real network (a public testnet first, then mainnet or a permissioned chain), and move the server's signing key into a proper secrets manager / hardware wallet instead of a `.env` file.
- Turn on real email delivery (SMTP credentials) so password resets and issuance notifications actually reach people.
- Configure real Pinata/IPFS credentials (or another persistent object store) so certificate files don't depend on this one server's local disk.
- Point `MONGODB_URI` at a managed, backed-up database (e.g. MongoDB Atlas) rather than a local instance.
- Review rate limits, CORS origins, and secrets for a production domain instead of `localhost`.

## 10. Where to look in the code

| If you want to change... | Look at... |
|---|---|
| What a certificate contains | `server/src/models/Certificate.ts` |
| How issuance/verification/revocation actually work | `server/src/services/certificateService.ts` |
| Who's allowed to see/edit what | `server/src/utils/authorization.ts` |
| What's written on-chain | `contracts/contracts/BlockCertifyRegistry.sol` and `server/src/services/blockchainService.ts` |
| Where certificate files are stored | `server/src/services/ipfsService.ts` |
| The public verification page | `client/app/verify/page.tsx` and `client/components/verification-widget.tsx` |
| The certificate issuance form | `client/components/forms/certificate-issuance-form.tsx` |
| Dashboards (admin/institution/student) | `client/app/dashboard/` |
| API routes | `server/src/routes/` |
