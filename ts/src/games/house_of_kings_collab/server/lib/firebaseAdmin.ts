import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let appInstance: App | null = null;
let dbInstance: Firestore | null = null;

export function initFirebaseAdmin(): App {
  if (!appInstance) {
    if (!getApps().length) {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      let firebaseConfig: any = {};
      if (fs.existsSync(configPath)) {
        firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
      const projectId = firebaseConfig.projectId || 'youtubeauto-497203';

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
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
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
