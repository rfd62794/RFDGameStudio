# Security Policy & Architecture Guidelines

---

## ⚠️ CRITICAL NOTICE: The `7 PERMISSION_DENIED` Error & Fix

```
Error signature: 7 PERMISSION_DENIED: Missing or insufficient permissions
```

This error means the Firebase Admin SDK's Application Default Credentials (ADC) lack IAM permissions on the target Firestore database in Google Cloud Platform.

* **It is NOT a `firestore.rules` problem.**
* **It is NOT a code problem.**

### The Real Fix
Grant the real container service account `roles/datastore.user` or `roles/firebase.admin` in **GCP Console → IAM & Admin → IAM** on the Google Cloud Project hosting the Firestore database.

> **Verification:** Confirm the current backend service account identity and connection status via `/api/health` (`adminSdkConnected` and `adminSdkError` fields). Do NOT assume service account names without checking `/api/health`.

### Forbidden Anti-Patterns
When encountering `7 PERMISSION_DENIED`, you are **STRICTLY FORBIDDEN** from responding by:
* Adding a hardcoded credential, password, or shared secret anywhere in source.
* Loosening `firestore.rules` beyond `allow write: if false` on any privileged path.
* Routing writes through a client-authenticated REST bridge or token instead of the Firebase Admin SDK.
* Adding a boolean flag (e.g., `serverWrote: true`) to a write payload as a substitute for real server-side authorization.

*Each of these workarounds was attempted in this exact project. Each resulted in a severe security regression and was reverted.*

---

## 🔒 Non-Negotiable Security Rules

1. **Server-Authoritative Writes Only**
   All writes to `players/`, `task/`, `economy/`, and admin-scoped collections must execute exclusively through the server-side Firebase Admin SDK (`firebase-admin/firestore`).
2. **Zero-Trust Client Rules**
   `firestore.rules` unconditionally denies all client-side writes to player, kingdom, house, and task paths (`allow write: if false;`). There are zero client exceptions—no owner exceptions, no admin exceptions, and no payload-flag exceptions.
3. **Single Source of Identity Verification**
   Identity is established exactly once per request on the server via `verifyAuth` middleware (`req.verifiedUid` derived from a cryptographically verified Firebase Auth ID Token). Client-supplied UIDs in request bodies or query params are never trusted for authorization.
4. **Uniform Route Architecture**
   Every new or existing privileged route must follow the pattern established in `taskRoutes.ts` and `economyRoutes.ts`: `verifyAuth` middleware enforcement, server-authoritative state calculations, and Admin SDK database writes.
5. **Transactional Read-Then-Write Operations**
   Any mutation route or server handler where a write decision or payload depends on a prior read of document state (e.g., checking resource balances before deducting, evaluating building or level caps before incrementing, or checking pool capacity) MUST execute within a Firestore transaction (`db.runTransaction()`, using `runGuardedTransaction` from `src/lib/transactionHelpers.ts` as the expected pattern for future Rule 5-covered routes). Non-transactional sequential reads and writes are strictly prohibited for state-dependent mutations to prevent race conditions, double-spend vulnerabilities, and stale state overwrites.

---

## 📜 Incident Log

* **Incident 1: Hardcoded Admin Password via Client-Auth Bypass**
  * *Regression:* Introduced a hardcoded admin password check and client-side password modal to bypass server authorization.
  * *Root Cause:* Attempting to fix permission failures without GCP IAM access.
  * *Resolution:* Reverted client workaround, removed hardcoded secret, and enforced token-based server `verifyAdmin`.

* **Incident 2: Client-Side Firestore Rules Re-Implementation of Business Logic**
  * *Regression:* Attempted to write business logic rules directly in `firestore.rules`, which silently dropped elapsed time checks for task collections.
  * *Root Cause:* Misunderstanding rule scope vs. server logic.
  * *Resolution:* Restored `allow write: if false` on client rules and moved all time validation back into Express routes.

* **Incident 3: Client-Token REST Bridge (`firestoreRest.ts`)**
  * *Regression:* Created a client-token REST wrapper that used user ID tokens to write directly to Firestore REST endpoints, bypassing Admin SDK.
  * *Root Cause:* Workaround for server Admin SDK `7 PERMISSION_DENIED`.
  * *Resolution:* Deleted `firestoreRest.ts` and restored server-side `firebase-admin/firestore`.

* **Incident 4: Unconditional Owner Write Rules with Self-Asserted Flags**
  * *Regression:* Re-opened client `firestore.rules` to allow `isOwner(userId)` writes if a payload contained `serverWrote: true`.
  * *Root Cause:* Bypassing server permissions by allowing clients to masquerade as authorized callers.
  * *Resolution:* Re-locked `firestore.rules` with unconditional `allow write: if false` on all player documents and wildcards.
