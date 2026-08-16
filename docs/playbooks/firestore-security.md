# Firestore Security Playbook

*August 15, 2026 | Studio-wide guidance for any backend-integrated project.
Read this before building a Firebase/Firestore-backed game or service.
This is not a sanitized summary — every incident below actually happened
and was actually reverted.*

**Source:** House of Kings Collab (`SECURITY.md`, `firestore.rules`,
`src/lib/transactionHelpers.ts`, `src/middleware/verifyAuth.ts`,
`src/lib/firebaseAdmin.ts`). Generalized into studio-wide guidance
alongside the shared `ts/src/engine/shared/firestoreBackend/` modules.

---

## The `7 PERMISSION_DENIED` Error

```
Error signature: 7 PERMISSION_DENIED: Missing or insufficient permissions
```

This error means the Firebase Admin SDK's Application Default Credentials
(ADC) lack IAM permissions on the target Firestore database in Google
Cloud Platform.

* **It is NOT a `firestore.rules` problem.**
* **It is NOT a code problem.**

### The Real Fix

Grant the real container service account `roles/datastore.user` or
`roles/firebase.admin` in **GCP Console → IAM & Admin → IAM** on the
Google Cloud Project hosting the Firestore database.

> **Verification:** Confirm the current backend service account identity
> and connection status via `/api/health` (`adminSdkConnected` and
> `adminSdkError` fields). Do NOT assume service account names without
> checking `/api/health`.

### Forbidden Anti-Patterns

When encountering `7 PERMISSION_DENIED`, you are **STRICTLY FORBIDDEN**
from responding by:

* Adding a hardcoded credential, password, or shared secret anywhere in
  source.
* Loosening `firestore.rules` beyond `allow write: if false` on any
  privileged path.
* Routing writes through a client-authenticated REST bridge or token
  instead of the Firebase Admin SDK.
* Adding a boolean flag (e.g., `serverWrote: true`) to a write payload
  as a substitute for real server-side authorization.

**Each of these workarounds was attempted in the House of Kings Collab
project. Each resulted in a severe security regression and was reverted.
The incident log below documents each one.**

---

## Non-Negotiable Security Rules

### Rule 1: Server-Authoritative Writes Only

All writes to player, task, economy, and admin-scoped collections must
execute exclusively through the server-side Firebase Admin SDK
(`firebase-admin/firestore`). The client must never write to these
collections directly.

### Rule 2: Zero-Trust Client Rules

`firestore.rules` unconditionally denies all client-side writes to
player, kingdom, house, and task paths (`allow write: if false;`).
There are zero client exceptions — no owner exceptions, no admin
exceptions, and no payload-flag exceptions.

The canonical hardened rules pattern:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /health_check/{doc} {
      allow read: if true;
    }
    match /{document=**} {
      allow read: if true;   // reads may be opened per project needs
      allow write: if false; // ALL writes go through the Admin SDK
    }
  }
}
```

### Rule 3: Single Source of Identity Verification

Identity is established exactly once per request on the server via
`verifyAuth` middleware (`req.verifiedUid` derived from a
cryptographically verified Firebase Auth ID Token). Client-supplied UIDs
in request bodies or query params are never trusted for authorization.

### Rule 4: Uniform Route Architecture

Every new or existing privileged route must follow the pattern
established in the House of Kings Collab routes: `verifyAuth` middleware
enforcement, server-authoritative state calculations, and Admin SDK
database writes.

### Rule 5: Transactional Read-Then-Write Operations

Any mutation route or server handler where a write decision or payload
depends on a prior read of document state (e.g., checking resource
balances before deducting, evaluating building or level caps before
incrementing, or checking pool capacity) MUST execute within a Firestore
transaction (`db.runTransaction()`, using `runGuardedTransaction` from
`ts/src/engine/shared/firestoreBackend/transactionHelpers.ts`).

Non-transactional sequential reads and writes are strictly prohibited
for state-dependent mutations. This prevents race conditions,
double-spend vulnerabilities, and stale state overwrites.

---

## Incident Log

These are documented, specific, actually-happened regressions from the
House of Kings Collab project. Each was introduced as a workaround for
`7 PERMISSION_DENIED` or related permission failures, each created a
real security hole, and each was reverted. They are preserved here
concrete and unsanitized — the real value is that these are not
hypothetical.

### Incident 1: Hardcoded Admin Password via Client-Auth Bypass

* **Regression:** Introduced a hardcoded admin password check and
  client-side password modal to bypass server authorization.
* **Root Cause:** Attempting to fix permission failures without GCP IAM
  access.
* **Resolution:** Reverted client workaround, removed hardcoded secret,
  and enforced token-based server `verifyAdmin`.
* **Lesson:** Never hardcode credentials. Admin verification must use
  server-side token verification, not client-supplied passwords. The
  shared `verifyAuth.ts` module's `createVerifyAdmin` requires the admin
  email to be supplied by the caller — no hardcoded defaults.

### Incident 2: Client-Side Firestore Rules Re-Implementation of Business Logic

* **Regression:** Attempted to write business logic rules directly in
  `firestore.rules`, which silently dropped elapsed time checks for task
  collections.
* **Root Cause:** Misunderstanding rule scope vs. server logic.
  `firestore.rules` is a security boundary, not a business logic engine.
  Complex temporal logic (e.g., "has 90 seconds elapsed since
  startTime?") cannot be reliably expressed in the rules language.
* **Resolution:** Restored `allow write: if false` on client rules and
  moved all time validation back into Express routes.
* **Lesson:** `firestore.rules` is for access control only. Business
  logic belongs in server-side code. If you find yourself writing
  complex conditions in rules, stop — you're creating Incident 2.

### Incident 3: Client-Token REST Bridge (`firestoreRest.ts`)

* **Regression:** Created a client-token REST wrapper that used user ID
  tokens to write directly to Firestore REST endpoints, bypassing the
  Admin SDK.
* **Root Cause:** Workaround for server Admin SDK
  `7 PERMISSION_DENIED`.
* **Resolution:** Deleted `firestoreRest.ts` and restored server-side
  `firebase-admin/firestore`.
* **Lesson:** The Admin SDK is the only legitimate write path. Routing
  around it via REST + client tokens doesn't fix the permission problem
  — it creates a new one by exposing write access to any authenticated
  client.

### Incident 4: Unconditional Owner Write Rules with Self-Asserted Flags

* **Regression:** Re-opened client `firestore.rules` to allow
  `isOwner(userId)` writes if a payload contained `serverWrote: true`.
* **Root Cause:** Bypassing server permissions by allowing clients to
  masquerade as authorized callers.
* **Resolution:** Re-locked `firestore.rules` with unconditional
  `allow write: if false` on all player documents and wildcards.
* **Lesson:** A client-supplied flag is not authentication. Any write
  rule that trusts client-supplied data for authorization is a
  vulnerability. The rules must deny all client writes unconditionally.

### Incident 5: `setInterval` Regression (Background Timer in Serverless)

* **Regression:** Used `setInterval` for daily evaluation of kingdom
  and house mechanics. In a scale-to-zero Cloud Run environment, the
  container froze during idle periods, delaying evaluations indefinitely.
  Multi-instance scaling caused duplicate evaluations and double-rewards.
* **Root Cause:** Misapplying long-running server patterns to a
  serverless, scale-to-zero architecture.
* **Resolution:** Replaced `setInterval` with **Visit-Triggered
  Evaluation** — each HTTP request checks `lastEvaluatedAt` on the
  Firestore document, and if 24 hours have elapsed, the evaluation runs
  atomically within the request handler.
* **Lesson:** Never use `setInterval` for scheduled work in a
  serverless/containerized environment. Use visit-triggered evaluation
  (check timestamp on read, evaluate if stale) or Cloud Scheduler +
  Cloud Functions.

---

## Shared Infrastructure

The following shared modules implement these rules as reusable code:

| Module | Path | Purpose |
|---|---|---|
| `transactionHelpers.ts` | `ts/src/engine/shared/firestoreBackend/` | `runGuardedTransaction` — Rule 5 |
| `verifyAuth.ts` | `ts/src/engine/shared/firestoreBackend/` | Token verification + admin factory — Rules 3, 4 |
| `firebaseAdmin.ts` | `ts/src/engine/shared/firestoreBackend/` | Singleton Admin SDK init — Rule 1 |
| `paths.ts` | `ts/src/engine/shared/firestoreBackend/` | Document path construction — safe path building |

Any new Firebase-backed project should import from these shared modules
rather than re-implementing the patterns. The incident log above
documents what happens when these patterns are not followed.
