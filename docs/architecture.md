# BlockCertify Architecture

## High-level system design

BlockCertify is organized as a three-workspace monorepo:

- `client/`: Next.js 15 frontend, Auth.js session handling, dashboards, verification UI
- `server/`: Express API, JWT auth, RBAC, certificate lifecycle services, audit logging, exports, notifications
- `contracts/`: Solidity smart contract, Hardhat config, deployment scripts, contract tests
- `database/`: sample data and seed artifacts

## Core data flow

1. A user signs in through the frontend credentials flow.
2. The Express API validates the credentials and returns a JWT access token.
3. Auth.js stores session state in the frontend; API calls send the JWT as a Bearer token.
4. An institution uploads a certificate PDF.
5. The API hashes the PDF, pins the file and metadata to IPFS, writes the issuance to the smart contract, stores the business record in MongoDB, generates a QR payload, notifies the student, and records audit activity.
6. Public verification compares MongoDB certificate data against on-chain certificate data using read-only contract calls only.

## Certificate ownership and authorization

- `admin` users can access all certificate records
- `institution` users are restricted to certificates owned by their institution
- `student` users are restricted to certificates tied to their student identity
- Shared authorization helpers generate list queries and assert per-certificate access before view, update, or revoke operations

## Verification model

Verification is intentionally read-only:

- MongoDB provides the application certificate record
- the contract `getCertificate` view call provides the on-chain record
- hashes and revocation state are compared server-side
- verification never auto-broadcasts blockchain transactions and never creates blockchain transaction logs

## Scalability and operations notes

- Stateless API instances with JWT authentication
- MongoDB indexes for certificate, hash, and transaction lookups
- Separate verification rate limiting for public verification endpoints
- Modular services for blockchain, IPFS, exports, email, analytics, and notifications
- Contract tests and server unit tests protect the core issuance and verification flows
