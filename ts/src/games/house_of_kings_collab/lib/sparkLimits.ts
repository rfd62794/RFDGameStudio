// Real Spark (free) tier limits, as verified from Firebase's own
// current pricing documentation (https://firebase.google.com/pricing).
export const SPARK_LIMITS = {
  readsPerDay: 50000,
  writesPerDay: 20000,
  deletesPerDay: 20000,
  storageGiB: 1,
  egressGiBPerMonth: 10,
  monthlyActiveUsers: 50000,
};
