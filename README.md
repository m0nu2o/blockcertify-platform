# BlockCertify

BlockCertify is a production-focused monorepo for issuing, notarizing, and verifying digital certificates with a Next.js frontend, an Express + MongoDB API, and a Hardhat-managed Ethereum contract.

## Highlights

- Next.js 15 + React 19 frontend with Auth.js session handling
- Express.js API with JWT Bearer authentication
- MongoDB + Mongoose models for certificates, users, institutions, students, notifications, settings, and audit logs
- Solidity smart contract for certificate issue / update / revoke lifecycle
- IPFS + Pinata integration for PDF and metadata storage
- QR verification, analytics, exports, notifications, and audit logging
- Role-based dashboards for admin, institution, and student accounts
- Server tests with Jest and contract tests with Hardhat/Mocha

## Monorepo structure

```text
client/       Next.js application
server/       Express API and business logic
contracts/    Hardhat smart contracts and deployment scripts
docs/         Architecture and API documentation
database/     Seed artifacts and sample data
public/       Shared root-level assets
```

## Tech stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- next-auth
- react-hot-toast
- Recharts

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT + bcrypt
- Zod validation
- Helmet, CORS, express-rate-limit, xss-clean, hpp, express-mongo-sanitize

### Blockchain and storage
- Solidity 0.8.24
- Hardhat
- Ethers.js v6
- IPFS / Pinata

## Security model

- Auth.js stores frontend session state, but API authorization uses server-issued `Authorization: Bearer <token>` headers
- Role-based access control for `admin`, `institution`, and `student`
- Reusable certificate ownership checks prevent cross-tenant access (IDOR)
- Certificate update payloads are allow-listed and validated with strict Zod schemas
- Public verification is read-only and does not broadcast blockchain transactions
- Forgot-password responses are enumeration-safe and never return reset tokens in the API response
- Verification endpoints use stricter rate limiting than the global API limiter
- Audit logging remains active for tracked privileged operations

## Public verification behavior

Public verification compares MongoDB certificate data with on-chain certificate state using read-only contract calls only.

Verification does **not**:
- sign transactions
- call `tx.wait()`
- spend gas
- emit verification events
- create `BlockchainTransaction` rows

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment files

```bash
cp .env.example .env
cp client/.env.example client/.env.local
cp server/.env.example server/.env
cp contracts/.env.example contracts/.env
```

### 3. Start a local Hardhat node

```bash
npm run node --workspace contracts
```

### 4. Deploy the contract locally

In a separate terminal:

```bash
npm run deploy:local --workspace contracts
```

Update both of these files with the deployed address:
- `server/.env` → `ETH_CONTRACT_ADDRESS`
- `client/.env.local` → `NEXT_PUBLIC_CONTRACT_ADDRESS`

> If your previously deployed contract predates the read-only verification ABI, redeploy it and update both addresses after merge.

### 5. Seed the database

```bash
npm run seed --workspace server
```

### 6. Run the platform

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- API: `http://localhost:5000`
- Documentation page: `http://localhost:3000/documentation`

## Default seed users

| Role | Email | Password |
|---|---|---|
| Admin | admin@blockcertify.com | Admin@12345 |
| Institution | registrar@futureuniversity.edu | Welcome@123 |
| Student | student@blockcertify.com | Welcome@123 |

## Key API routes

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

### Certificates
- `GET /api/certificates`
- `GET /api/certificates/:id`
- `POST /api/certificates`
- `POST /api/certificates/bulk/upload`
- `PATCH /api/certificates/:id/update`
- `PATCH /api/certificates/:id/revoke`
- `GET /api/certificates/exports/:type`

### Verification
- `POST /api/verification/id`
- `POST /api/verification/hash`
- `POST /api/verification/transaction`
- `POST /api/verification/qr`

### Analytics and operations
- `GET /api/analytics/overview`
- `GET /api/analytics/admin`
- `GET /api/analytics/institution`
- `GET /api/analytics/student`
- `GET /api/admin/audit-logs`
- `GET /api/admin/blockchain-transactions`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

## Testing

- Server tests: `npm run test --workspace server`
- Contract tests: `npm run test --workspace contracts`
- Client currently has no dedicated frontend test runner configured in this repository

## Deployment notes

- `client/` includes Vercel-friendly configuration
- `server/` includes Railway / Docker deployment assets
- MongoDB Atlas is expected for production persistence
- Hardhat network config supports `localhost` and `sepolia`

## License

MIT
