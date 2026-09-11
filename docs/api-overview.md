# BlockCertify API Overview

This document reflects the current BlockCertify API surface.

## Authentication model

- Frontend session state is handled by Auth.js
- Protected API routes use `Authorization: Bearer <token>`
- There is no active CSRF token flow for the API because state-changing requests are Bearer-token authenticated

## Response envelope

Most JSON routes use the same envelope:

```json
{
  "success": true,
  "message": "Human readable status",
  "data": {}
}
```

## Authentication routes

### `POST /api/auth/register`
Create a user account.

### `POST /api/auth/login`
Returns a JWT access token and user payload for Auth.js credential login.

### `POST /api/auth/forgot-password`
Always returns the same generic response:

```json
{
  "success": true,
  "message": "If that email exists, a reset link has been sent.",
  "data": null
}
```

The API never discloses whether the email exists and never returns the reset token or reset link.

### `POST /api/auth/reset-password`
Resets a password using the emailed token.

### `GET /api/auth/me`
Returns the authenticated user profile.

## Certificate routes

> All certificate routes require authentication. Ownership is enforced for admin, institution, and student roles.

### `GET /api/certificates`
List certificates visible to the current user.

Supported query params:
- `page`
- `limit`
- `search`
- `status`

### `GET /api/certificates/:id`
Fetch a single certificate by `certificateId`.

### `POST /api/certificates`
Issue a certificate.

Expected upload field:
- `certificatePdf`

### `POST /api/certificates/bulk/upload`
Bulk issue certificates from CSV upload.

Expected upload field:
- `file`

Behavior:
- processes rows in batches of 5
- uses `Promise.allSettled()` per batch
- returns partial success / failure results instead of aborting the full import

Response shape:

```json
{
  "success": true,
  "message": "Bulk certificates processed",
  "data": {
    "succeeded": [
      {
        "row": {},
        "success": true,
        "certificateId": "BC-12345678"
      }
    ],
    "failed": [
      {
        "row": {},
        "success": false,
        "error": "Reason"
      }
    ]
  }
}
```

### `PATCH /api/certificates/:id/update`
Update an existing certificate.

Allowed fields only:
- `degree`
- `course`
- `department`
- `graduationYear`
- `expiryDate`
- `tags`

Security notes:
- request body is validated with a strict Zod schema
- unknown keys are rejected
- dangerous keys like `__proto__`, `constructor`, and `prototype` are rejected

### `PATCH /api/certificates/:id/revoke`
Revoke a certificate.

### `GET /api/certificates/exports/:type`
Export certificates in one of the supported formats:
- `csv`
- `xlsx`
- `pdf`

## Verification routes

> Verification routes are public and protected by a stricter verification-specific rate limiter.

### `POST /api/verification/id`
Verify by `certificateId`.

### `POST /api/verification/hash`
Verify by file hash or blockchain hash.

### `POST /api/verification/transaction`
Verify by transaction hash.

### `POST /api/verification/qr`
Verify from a QR payload.

Behavior:
- attempts to parse the payload as a URL
- if URL parsing fails, falls back to treating the payload as a raw certificate ID
- invalid short payloads return a clean `400`

### Verification guarantees

Public verification is read-only:
- no signed transaction
- no gas spend
- no `tx.wait()`
- no verification event emission
- no `BlockchainTransaction` record creation

The backend verifies by:
1. loading the MongoDB certificate
2. loading the on-chain certificate with a read-only contract call
3. comparing certificate hashes and revocation state
4. returning the verification verdict

## Analytics routes

### `GET /api/analytics/overview`
Platform-wide analytics summary.

### `GET /api/analytics/admin`
Admin-only analytics.

### `GET /api/analytics/institution`
Institution or admin analytics scoped to the institution account.

### `GET /api/analytics/student`
Student or admin analytics scoped to the student account.

## Notification routes

### `GET /api/notifications`
List notifications for the authenticated user.

### `PATCH /api/notifications/:id/read`
Mark a notification as read.

## Admin routes

> All admin routes require `admin` role.

### `GET /api/admin/users`
List users.

### `GET /api/admin/institutions`
List institutions.

### `GET /api/admin/audit-logs`
List recent audit logs.

### `GET /api/admin/blockchain-transactions`
List recorded blockchain write operations.

### `GET /api/admin/settings`
Get platform settings.

### `PATCH /api/admin/settings`
Update platform settings.

## Contract compatibility note

If the deployed contract address points to an older contract whose verification ABI or mutability differs from the current repository contract, you must:
1. redeploy the contract
2. update `server/.env` → `ETH_CONTRACT_ADDRESS`
3. update `client/.env.local` → `NEXT_PUBLIC_CONTRACT_ADDRESS`
