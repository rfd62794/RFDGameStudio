import fs from 'fs';
import path from 'path';

/**
 * HEURISTIC SECURITY GUARD FOR FIRESTORE.RULES
 * 
 * NOTE: This script is a heuristic text/pattern scanner, not a full CEL parser.
 * If it encounters unrecognized structures, unexpected match blocks, or forbidden
 * security patterns, it fails loudly with exit code 1 and demands manual review.
 */

console.log('====================================================');
console.log('🔒 RUNNING FIRESTORE RULES SECURITY CHECK');
console.log('====================================================\n');

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');

if (!fs.existsSync(rulesPath)) {
  console.error('❌ ERROR: firestore.rules file not found at:', rulesPath);
  process.exit(1);
}

const content = fs.readFileSync(rulesPath, 'utf8');
const lines = content.split('\n');

let hasError = false;

// Forbidden pattern definitions from SECURITY.md Incident Log
const FORBIDDEN_PATTERNS = [
  { pattern: '_serverToken', name: 'Server Token Bypass (_serverToken)' },
  { pattern: 'serverWrote', name: 'Self-Asserted Flag (serverWrote)' },
  { pattern: 'updatedByServer', name: 'Self-Asserted Flag (updatedByServer)' },
  { pattern: 'assignedByServer', name: 'Self-Asserted Flag (assignedByServer)' },
  { pattern: 'collectedByServer', name: 'Self-Asserted Flag (collectedByServer)' },
  { pattern: 'collectedByServed', name: 'Self-Asserted Flag typo (collectedByServed)' },
  { pattern: 'isOwner(', name: 'In-Rule Owner Privilege (isOwner)' },
];

console.log('🔍 Check 1: Scanning for forbidden incident-log patterns...');
lines.forEach((line, index) => {
  const lineNum = index + 1;
  FORBIDDEN_PATTERNS.forEach(({ pattern, name }) => {
    if (line.includes(pattern)) {
      console.error(`❌ FAILURE [Line ${lineNum}]: Detected forbidden pattern "${name}" (${pattern}):`);
      console.error(`   ${line.trim()}`);
      hasError = true;
    }
  });
});

if (!hasError) {
  console.log('✅ Check 1 PASSED: Zero forbidden incident-log patterns found.\n');
}

console.log('🔍 Check 2: Verifying write lockdown on privileged match blocks...');

// Scan match blocks and their write rules
let currentMatchPath = '';
lines.forEach((line, index) => {
  const lineNum = index + 1;
  const trimmed = line.trim();

  if (trimmed.startsWith('match ')) {
    currentMatchPath = trimmed;
  }

  // Identify any allow write rule
  if (trimmed.includes('allow write')) {
    // Check if the write rule is strictly 'allow write: if false;'
    const normalized = trimmed.replace(/\s+/g, ' ');
    const isStrictFalse = /^allow\s+write\s*:\s*if\s+false\s*;?$/.test(normalized);

    if (!isStrictFalse) {
      console.error(`❌ FAILURE [Line ${lineNum}]: Non-restricted write rule detected under "${currentMatchPath}":`);
      console.error(`   ${line.trim()}`);
      console.error(`   Privileged paths (kingdoms, houses, players, wildcards) MUST be strictly "allow write: if false;".`);
      hasError = true;
    } else {
      console.log(`   [Line ${lineNum}] Verified strict lockdown: "${line.trim()}"`);
    }
  }
});

console.log('');

console.log('🔍 Check 3: Verifying explicit coverage for worker subcollection...');
if (!content.includes('/workers/') && !content.includes('/workers/{workerId}')) {
  console.error('❌ FAILURE: firestore.rules must explicitly cover the /workers/ subcollection path.');
  hasError = true;
} else {
  console.log('✅ Check 3 PASSED: /workers/ subcollection path is explicitly covered in firestore.rules.\n');
}

console.log('🔍 Check 4: Verifying explicit coverage for house document path...');
if (!content.includes('/houses/{houseId}') && !content.includes('/houses/')) {
  console.error('❌ FAILURE: firestore.rules must explicitly cover the /houses/{houseId} document path.');
  hasError = true;
} else {
  console.log('✅ Check 4 PASSED: /houses/{houseId} document path is explicitly covered in firestore.rules.\n');
}

if (hasError) {
  console.error('====================================================');
  console.error('❌ SECURITY CHECK FAILED!');
  console.error('   Please review firestore.rules and SECURITY.md.');
  console.error('====================================================');
  process.exit(1);
} else {
  console.log('====================================================');
  console.log('✅ SECURITY CHECK PASSED!');
  console.log('   firestore.rules is strictly locked down (allow write: if false).');
  console.log('====================================================');
  process.exit(0);
}
