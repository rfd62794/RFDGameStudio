import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

/**
 * LIVE CLIENT WRITE REGRESSION TEST
 * 
 * IMPORTANT: In this test script, a SUCCESSFUL client write to Firestore is a 
 * CRITICAL SECURITY FAILURE. All client writes to player/task paths must be
 * REJECTED with "permission-denied" by firestore.rules.
 */

console.log('====================================================');
console.log('🧪 RUNNING LIVE CLIENT-WRITE REGRESSION TEST');
console.log('====================================================\n');

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');

if (!fs.existsSync(configPath)) {
  console.error('❌ ERROR: firebase-applet-config.json not found.');
  process.exit(1);
}

const firebaseConfigJson = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const databaseId = firebaseConfigJson.firestoreDatabaseId || '(default)';
const db = getFirestore(app, databaseId);

async function runRegressionTest() {
  let passed = true;

  // Authenticate anonymously if possible to simulate an authenticated client session
  try {
    await signInAnonymously(auth);
    console.log(`🔑 Client authenticated anonymously (UID: ${auth.currentUser?.uid || 'anon'}).\n`);
  } catch (err: any) {
    console.log(`ℹ️ Anonymous sign-in skipped or unavailable: ${err.message}. Proceeding as unauthenticated client.\n`);
  }

  const targetDocRef = doc(
    db,
    'kingdoms',
    'kingdom-mvp-0',
    'houses',
    'house-of-kings-default',
    'players',
    auth.currentUser?.uid || 'test-regression-uid',
    'task',
    'current'
  );

  // -------------------------------------------------------------
  // ATTEMPT 1: Direct Client Write Attempt
  // -------------------------------------------------------------
  console.log('🧪 Attempt 1: Direct Client setDoc({ gold: 999999 }) on privileged path...');
  try {
    await setDoc(targetDocRef, {
      gold: 999999,
      updatedAt: Date.now(),
      status: 'hacked_via_client',
    });

    // IF WE REACH HERE, THE WRITE SUCCEEDED! THIS IS A CRITICAL FAILURE!
    console.error('\n🚨 CRITICAL SECURITY FAILURE! Direct client write SUCCEEDED!');
    console.error('   firestore.rules failed to deny client write permission.');
    passed = false;
  } catch (err: any) {
    const isPermissionDenied =
      err.code === 'permission-denied' ||
      (err.message && err.message.toLowerCase().includes('permission'));

    if (isPermissionDenied) {
      console.log('✅ Attempt 1 PASSED: Write rejected by Security Rules with "permission-denied".\n');
    } else {
      console.error(`❌ Attempt 1 FAILED with unexpected error (expected "permission-denied"): ${err.message}\n`);
      passed = false;
    }
  }

  // -------------------------------------------------------------
  // ATTEMPT 2: Self-Asserted Flag Attempt (Incident 4 Pattern)
  // -------------------------------------------------------------
  console.log('🧪 Attempt 2: Self-Asserted Flag setDoc({ serverWrote: true, updatedByServer: true, ... })...');
  try {
    await setDoc(targetDocRef, {
      gold: 999999,
      serverWrote: true,
      updatedByServer: true,
      assignedByServer: true,
      collectedByServer: true,
      updatedAt: Date.now(),
    });

    // IF WE REACH HERE, THE WRITE SUCCEEDED! THIS IS A CRITICAL FAILURE!
    console.error('\n🚨 CRITICAL SECURITY FAILURE! Self-asserted flag write SUCCEEDED!');
    console.error('   firestore.rules permitted client write using false server flags.');
    passed = false;
  } catch (err: any) {
    const isPermissionDenied =
      err.code === 'permission-denied' ||
      (err.message && err.message.toLowerCase().includes('permission'));

    if (isPermissionDenied) {
      console.log('✅ Attempt 2 PASSED: Self-asserted flag write rejected by Security Rules with "permission-denied".\n');
    } else {
      console.error(`❌ Attempt 2 FAILED with unexpected error (expected "permission-denied"): ${err.message}\n`);
      passed = false;
    }
  }

  console.log('====================================================');
  if (passed) {
    console.log('✅ REGRESSION TEST PASSED!');
    console.log('   All direct client write attempts were successfully blocked by firestore.rules.');
    console.log('====================================================');
    process.exit(0);
  } else {
    console.error('❌ REGRESSION TEST FAILED!');
    console.error('   Security rules did not enforce client write denial.');
    console.error('====================================================');
    process.exit(1);
  }
}

runRegressionTest().catch((err) => {
  console.error('❌ Unexpected execution error during regression test:', err);
  process.exit(1);
});
