// Shared Firestore Transaction Helper — generalized from House of Kings Collab
//
// Source: House of Kings Collab (src/lib/transactionHelpers.ts)
// Already generic — no HoK-specific content. Copied as-is.
//
// Pattern: any mutation route where a write decision depends on a prior
// read of document state MUST execute within a Firestore transaction
// using this helper. Non-transactional sequential reads and writes are
// strictly prohibited for state-dependent mutations (see
// docs/playbooks/firestore-security.md, Rule 5).

export async function runGuardedTransaction<T>(
  db: FirebaseFirestore.Firestore,
  work: (transaction: FirebaseFirestore.Transaction) => Promise<T>
): Promise<T> {
  try {
    return await db.runTransaction(work);
  } catch (err: any) {
    if (err && typeof err === 'object' && typeof err.status === 'number') throw err;
    throw { status: 500, error: err?.message || 'Transaction failed' };
  }
}
