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
