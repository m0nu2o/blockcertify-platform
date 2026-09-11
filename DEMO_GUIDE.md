# BlockCertify — Demo Guide

This is a step-by-step walkthrough for running BlockCertify on your own computer and demoing it, written for someone who hasn't set this project up before. No coding knowledge required — just follow the steps in order.

If you want to understand *how* the system works instead of just running it, read `PROJECT_DESIGN_AND_IMPLEMENTATION.md` alongside this guide.

## What you're demoing

BlockCertify lets a school or company issue digital certificates (diplomas, training completions, etc.) that:

- are permanently fingerprinted on a blockchain, so nobody can quietly edit or fake them later
- can be checked by anyone in seconds, without an account, by ID, QR code, file hash, or blockchain transaction hash
- can be revoked (e.g. if issued in error) with the revocation visible on-chain

## 1. What you need installed

Check what you already have by opening **PowerShell** (search "PowerShell" in the Start menu) and running:

```powershell
node -v
npm -v
```

You need **Node.js 20 or newer**. If either command says it isn't recognized, install Node.js:

1. Go to https://nodejs.org
2. Download the **LTS** version for Windows
3. Run the installer, keeping all defaults
4. Close and reopen PowerShell, then re-run `node -v` to confirm

You also need a **MongoDB database** running on your machine. Pick whichever of these is easiest for you:

| Option | Best if... | How |
|---|---|---|
| Docker | You have Docker Desktop installed | Run `docker run -d --name blockcertify-mongo -p 27017:27017 mongo:7` |
| MongoDB Community Server | You don't have Docker and don't mind a quick install | Download from https://www.mongodb.com/try/download/community, install with defaults (it installs itself as a background Windows service, so it starts automatically) |
| MongoDB Atlas (cloud) | You'd rather not install anything locally | Create a free cluster at https://www.mongodb.com/cloud/atlas, get its connection string, and paste it into `MONGODB_URI` in `server/.env` once that file exists (step 2 below) |

You do **not** need to sign up for anything blockchain-related — the demo uses a free local test blockchain (Hardhat) that runs entirely on your own computer and resets every time you restart it. There is no real money and nothing to lose involved.

You also do **not** need a Pinata/IPFS account. If you skip it, certificate files and metadata are stored on your own machine instead and served by the local server — everything else about the demo works exactly the same either way. Add a real Pinata key later only if you want certificates pinned to the public IPFS network.

## 2. One-command setup (recommended)

Once Node.js and MongoDB are ready, open PowerShell **in this project folder** (right-click inside the folder in File Explorer while holding Shift, choose "Open PowerShell window here", or `cd` into it manually) and run:

```powershell
.\start-demo.ps1
```

The first time you run it, PowerShell may block the script with a security message. If so, run this once to allow local scripts, then try again:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

This script will, in order:

1. Check Node.js is installed
2. Create the `.env` / `.env.local` files for you (copied from the included `.env.example` templates) and generate random secrets
3. Confirm MongoDB is reachable — if it isn't, it stops and tells you exactly what to do, then you re-run the script
4. Run `npm install` (first run only — this can take a few minutes)
5. Open a **second window** running your local test blockchain (leave this window open for the whole demo)
6. Deploy the certificate smart contract to that blockchain and save its address into the right config files automatically
7. Wipe and reseed the database with three demo accounts and one ready-to-verify sample certificate
8. Start the website and API in the current window

When it finishes, you'll see:

```
Frontend:        http://localhost:3000
API:             http://localhost:5000

Admin login:       admin@blockcertify.com / Admin@12345
Institution login: registrar@futureuniversity.edu / Welcome@123
Student login:     student@blockcertify.com / Welcome@123
```

Open http://localhost:3000 in your browser. You're ready to demo.

**To stop:** press `Ctrl+C` in the window running `npm run dev`, then close the blockchain window. **To restart later:** just run `.\start-demo.ps1` again — it always gives you a clean slate.

## 3. Manual setup (if you'd rather not use the script, or aren't on Windows)

Open four terminal windows in the project folder.

**Terminal 1 — one-time install and env files:**

```bash
npm install
cp .env.example .env
cp client/.env.example client/.env.local
cp server/.env.example server/.env
cp contracts/.env.example contracts/.env
```

Open `server/.env` and `client/.env.local` and replace the placeholder secrets (`replace_with_long_random_secret`) with any random string of your choosing. Confirm `MONGODB_URI` in `server/.env` points at your running MongoDB.

**Terminal 2 — local blockchain (leave running):**

```bash
npm run chain
```

**Terminal 3 — deploy the contract (one-off, after Terminal 2 says it's listening):**

```bash
npm run deploy:local --workspace contracts
```

Copy the address it prints (`BlockCertifyRegistry deployed to: 0x...`) into:
- `server/.env` → `ETH_CONTRACT_ADDRESS`
- `client/.env.local` → `NEXT_PUBLIC_CONTRACT_ADDRESS`

Then seed the database:

```bash
npm run seed --workspace server
```

**Terminal 4 — run the app:**

```bash
npm run dev
```

Visit http://localhost:3000.

> Because the local blockchain resets every time it's restarted, repeat Terminal 2–3's deploy step (and reseed) whenever you restart the chain — a deployed contract address only exists on the specific chain instance that deployed it.

## 4. A suggested demo script

A simple, impressive run-through, roughly 5 minutes:

1. **Landing page** (http://localhost:3000) — show the pitch: blockchain-backed certificates, tamper detection, instant verification.
2. **Log in as the institution** (`registrar@futureuniversity.edu` / `Welcome@123`) — this is the "university registrar" persona.
3. **Issue a certificate**: go to the certificate issuance form, fill in a student's details, upload any PDF as the certificate file, submit. Point out that behind the scenes this hashes the file, writes a fingerprint to the blockchain, and stores the record.
4. **Copy the new certificate's ID** (format `BC-XXXXXXXX`) from the confirmation or the certificate list.
5. **Open a new incognito/private browser tab** (to show this needs no login) at http://localhost:3000/verify, paste the certificate ID (or scan its QR code with your phone if your phone can reach your PC's IP on the same network), and show the verification result: valid, matches on-chain data, shows issuing institution.
6. **Log in as the student** (`student@blockcertify.com` / `Welcome@123`) and show their personal dashboard with their certificates.
7. **Log in as admin** (`admin@blockcertify.com` / `Admin@12345`) and show the platform-wide analytics, institution rankings, and audit log — the "we can see everything, and every action is logged" story.
8. **Revoke a certificate** as the institution, then re-run verification on it to show the verdict flips to revoked, with the reason visible — this is usually the "wow" moment, since it demonstrates the trust model isn't just theoretical.

A sample certificate is already seeded and ready to verify immediately (its ID is printed at the end of the setup script's output, and also visible in the institution's certificate list) if you want something to show before issuing a fresh one live.

## 5. Troubleshooting

**"MongoDB does not appear to be running"** — start MongoDB (see step 1) and re-run the script. If you're using Atlas, make sure `MONGODB_URI` in `server/.env` has your real Atlas connection string, and that your IP is allow-listed in Atlas's network access settings.

**The blockchain window shows an error and closes** — most likely another program is already using port 8545. Close whatever that is (or a leftover Hardhat window from a previous run) and try again.

**Certificate issuance fails right after you submit the form** — check the server terminal for the actual error. The most common cause is the contract address being out of date (e.g. you restarted the blockchain without redeploying). Re-run `start-demo.ps1`, or redo the deploy + reseed steps from the manual setup.

**Everything "worked" but nothing shows on the verify page** — double check you copied the exact certificate ID, including the `BC-` prefix.

**A previous setup attempt left things half-configured** — it's always safe to delete `node_modules` folders and the `.env` / `.env.local` files and start over from step 2.
