# House of Kings: Collab — System Architecture & Design Patterns

*August 12, 2026 | Reusable Pattern Reference & Engineering Handbook*

---

## Executive Summary

*House of Kings: Collab* is a multi-tenant, server-authoritative kingdom management application running on a serverless Node.js / Cloud Run architecture with Firebase Admin SDK and Firestore. 

This document distills the foundational patterns, architectural safeguards, and structural paradigms established across the project's six development phases. It serves as a blueprint for building scale-to-zero, real-time cloud gaming engines without falling into standard distributed systems traps (race conditions, double-spending, background timer memory leaks, or context confusion).

---

## 1. Visit-Triggered Evaluation vs. Server Background Processes

### The Problem with Server-Side `setInterval`
In early iterations, continuous time-boxed events (such as daily kingdom resource evaluations or festival resolutions) were attempted using Node.js background timers (`setInterval`). In a scale-to-zero, containerized environment (e.g. Cloud Run), background timers introduce critical failure modes:
1. **Container Idle Suspensions**: Serverless containers freeze CPU execution when no active HTTP requests are being processed. A `setInterval` timer stops ticking during idle periods, delaying daily resolutions indefinitely until traffic resumes.
2. **Multi-Instance Duplication**: When Cloud Run scales out horizontally across multiple container instances, every instance runs its own `setInterval`, causing duplicate evaluations, race conditions, and double-rewards.
3. **Container Cold-Starts & Ephemeral Memory**: Container recycles clear in-memory state, missing scheduled timer ticks completely.

### The Visit-Triggered Pattern
Every daily or time-boxed mechanic in this system uses **Visit-Triggered Evaluation** (`checkAndEvaluateKingdomsIfNeeded`, `checkAndEvaluateHouseFestivalIfNeeded`).

```
HTTP Request (GET /api/kingdom or POST /api/contributeFestival)
   │
   ├──► Check lastResolvedAt timestamp on Firestore Document
   │       │
   │       ├── [ < 24 Hours Elapsed ] ──► Proceed with normal request
   │       │
   │       └── [ ≥ 24 Hours Elapsed ] ──► Execute atomic daily resolution transaction
   │                                          │
   │                                          ├── Update cumulative state / scores
   │                                          ├── Reset daily contribution counters
   │                                          └── Advance lastResolvedAt timestamp
   │
   └──► Return current state to client
```

#### Why This Works:
- **Zero Idle Costs**: No background worker processes consume CPU or memory while the application is idle.
- **Strict Atomicity**: Resolution code runs inside a Firestore transaction (`runGuardedTransaction`). Even if 100 concurrent requests land simultaneously after the 24-hour mark, exactly **one** transaction succeeds in executing the daily calculation; the rest see the updated `lastResolvedAt` timestamp and safely bypass resolution.
- **Deterministic Continuity**: Evaluation occurs immediately on the next user interaction following the timestamp threshold, guaranteeing zero missed evaluation cycles.

---

## 2. Structural Economy Separation

### The Core Paradigm
The economy is partitioned into three distinct, non-interchangeable tiers:

| Tier | Currency / Asset | Scope | Persistence | Purpose |
|---|---|---|---|---|
| **Hard Currency** | `gold` | Player Level | Permanent | Upgrades, multiplier purchases, Church expansion |
| **Typed Resources** | `food`, `wood` | Player Level | Consumable | Worker task deployment, Fertility Festival offerings |
| **Shared Score** | `kingdomContribution`, `reputationScore` | Kingdom / House Level | Cumulative | Permanent progression tiers, House reputation levels |

### Structural Enforcement by Construction
Cross-tier leakage (e.g. converting infinite/soft resources directly into hard currency without server-enforced friction) destroys game balance. To prevent cross-contamination:
1. **Explicit Schema Separations**: `gold` (number), `resources` (map object `{ food, wood }`), and `kingdomContribution` (number) live in distinct fields on Firestore documents.
2. **Dedicated Endpoints**: Each resource type has dedicated endpoint handlers (`/api/collectTask` produces Gold/Kingdom Contribution, `/api/collectWorker` produces Food/Wood, `/api/contributeFestival` consumes Food/Wood for House Reputation).
3. **No Direct Inter-Currency Conversions**: Gold cannot buy Food or Wood directly, and Food cannot buy Gold. Every resource conversion requires time-locked worker or task execution gated by server authority.

---

## 3. The Three Shared Infrastructure Utilities

To eliminate copy-paste code and path typos across endpoints, all route handlers rely on three core utilities:

### 1. Unified Path Resolution (`src/lib/paths.ts`)
```typescript
export const kingdomPath = (kingdomId: string) => `kingdoms/${kingdomId}`;
export const housePath = (kingdomId: string, houseId: string) => `${kingdomPath(kingdomId)}/houses/${houseId}`;
export const playerPath = (kingdomId: string, houseId: string, userId: string) => `${housePath(kingdomId, houseId)}/players/${userId}`;
export const taskPath = (kingdomId: string, houseId: string, userId: string) => `${playerPath(kingdomId, houseId, userId)}/task/current`;
export const workersCollectionPath = (kingdomId: string, houseId: string, userId: string) => `${playerPath(kingdomId, houseId, userId)}/workers`;
```
**Problem Solved**: Prevents path string fragmentation, mismatched subcollection typos, and security rules mismatches. One single source of truth dictates the document hierarchy.

### 2. Request Identity & Context Resolution (`src/lib/playerContext.ts`)
```typescript
export function resolvePlayerContext(req: AuthenticatedRequest, source: 'body' | 'query' = 'body') {
  const kingdomId = req[source]?.kingdomId || 'kingdom-mvp-0';
  const houseId = req[source]?.houseId || 'house-of-kings-default';
  const userId = req.verifiedUid; // Always server-authenticated
  return { kingdomId, houseId, userId };
}
```
**Problem Solved**: Eliminates parameter extraction ambiguity across POST body and GET query parameters, enforcing `req.verifiedUid` as the sole authority for `userId`.

### 3. Guarded Transaction Execution (`src/lib/transactionHelpers.ts`)
```typescript
export async function runGuardedTransaction<T>(
  db: FirebaseFirestore.Firestore,
  updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>
): Promise<T> {
  return db.runTransaction(async (transaction) => {
    return updateFunction(transaction);
  });
}
```
**Problem Solved**: Standardizes transaction wrapping across all mutation routes, ensuring consistent retry mechanics and preventing unhandled read-after-write errors.

---

## 4. Server-Authoritative Identity Always

### The Immutable Rule
**Never trust client-supplied user identifiers (`userId`, `uid`) for authorization or state mutations.**

### Authentication Pipeline
1. **Bearer Token Validation**: Every protected route mounts `verifyAuth` middleware, which extracts the Firebase ID Token from the `Authorization: Bearer <token>` header and verifies it via `admin.auth().verifyIdToken(token)`.
2. **Context Injection**: Upon successful token verification, the middleware attaches `req.verifiedUid` and `req.verifiedEmail` to the Express request object.
3. **Route Enforcer**: Endpoint handlers use `req.verifiedUid` exclusively to resolve user document paths. Client-provided `targetUserId` fields in request bodies are ignored unless the actor has passed `verifyAdmin` Game Master checks.

---

## 5. Rule 5 (Generalized State Integrity Rule)

### Definition
> **Any database write whose decision, calculation, or validation depends on a prior read of state MUST execute inside an atomic transaction.**

### Why Non-Transactional Writes Fail
If an endpoint reads a document (`doc.get()`), evaluates a condition in application memory (`if (resources.food >= cost)`), and subsequently issues a write (`doc.set()`), concurrent requests arriving milliseconds apart will both read the *initial* state before either write commits. This causes:
- **Double-Spending**: Players spending the same resource balance twice.
- **Timer Overwrites**: Resetting task start times mid-execution.
- **Worker Pool Over-Allocation**: Deploying more workers than pool capacity permits.

### The Universal Solution Pattern
```typescript
await runGuardedTransaction(db, async (transaction) => {
  // 1. READ ALL DOCUMENTS FIRST INSIDE TRANSACTION
  const playerSnap = await transaction.get(playerRef);
  const data = playerSnap.data();

  // 2. VALIDATE INVARIANTS
  if (data.resources.food < requiredFood) {
    throw { status: 400, error: 'Insufficient resources' };
  }

  // 3. STAGE ALL WRITES INSIDE TRANSACTION
  transaction.set(playerRef, {
    'resources.food': FieldValue.increment(-requiredFood),
  }, { merge: true });

  return { success: true };
});
```

---

## Summary Checklist for Future System Extension

- [x] All database mutations use `runGuardedTransaction`.
- [x] All document/collection references use `paths.ts` helpers.
- [x] All authenticated routes verify tokens via `verifyAuth` and rely on `req.verifiedUid`.
- [x] No `setInterval` or background timers exist inside server code — all evaluations are visit-triggered.
- [x] `firestore.rules` enforces `allow write: if false;` on all server-managed collections.
