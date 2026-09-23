// Shared Firebase Admin SDK Initialization — generalized from House of Kings Collab
//
// Source: House of Kings Collab (src/lib/firebaseAdmin.ts)
// Generalized: the config file path and project ID fallback are now
// configurable. The core pattern (singleton initialization, lazy Firestore
// and Auth access, Application Default Credentials) is preserved exactly.
//
// CRITICAL: This module uses Application Default Credentials (ADC).
// Do NOT add hardcoded credentials, service account keys, or shared
// secrets anywhere in this file. See docs/playbooks/firestore-security.md,
// Incident 1 and the PERMISSION_DENIED notice.

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

export interface FirebaseAdminConfig {
  /** Path to the Firebase config JSON file (relative to process.cwd()) */
  configPath?: string;
  /** Fallback project ID if not found in config file */
  fallbackProjectId?: string;
}

let appInstance: App | null = null;
let dbInstance: Firestore | null = null;
let adminConfig: FirebaseAdminConfig = {};

/**
 * Configure the Firebase Admin SDK initialization.
 * Call this once at server startup before using getDb() or getAdminAuth().
 * If not called, defaults to 'firebase-applet-config.json' in process.cwd().
 */
export function configureFirebaseAdmin(config: FirebaseAdminConfig) {
  adminConfig = config;
}

export function initFirebaseAdmin(): App {
  if (!appInstance) {
    if (!getApps().length) {
      const configPath = path.resolve(
        process.cwd(),
        adminConfig.configPath || 'firebase-applet-config.json'
      );
      let firebaseConfig: any = {};
      if (fs.existsSync(configPath)) {
        firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
      const projectId = firebaseConfig.projectId || adminConfig.fallbackProjectId || '';

      appInstance = initializeApp({
        projectId,
      });
    } else {
      appInstance = getApps()[0];
    }
  }
  return appInstance;
}

export function getDb(): Firestore {
  initFirebaseAdmin();
  if (!dbInstance) {
    const configPath = path.resolve(
      process.cwd(),
      adminConfig.configPath || 'firebase-applet-config.json'
    );
    let firebaseConfig: any = {};
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
    dbInstance = getFirestore(databaseId);
  }
  return dbInstance;
}

export function getAdminAuth(): Auth {
  initFirebaseAdmin();
  return getAuth();
}
