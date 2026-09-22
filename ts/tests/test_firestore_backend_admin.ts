import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const adminSdk = vi.hoisted(() => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(),
  getFirestore: vi.fn(),
  getAuth: vi.fn(),
}));

vi.mock('firebase-admin/app', () => ({
  initializeApp: adminSdk.initializeApp,
  getApps: adminSdk.getApps,
  App: class {},
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: adminSdk.getFirestore,
  Firestore: class {},
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: adminSdk.getAuth,
  Auth: class {},
}));

type AdminModule = typeof import('../src/engine/shared/firestoreBackend/firebaseAdmin');

async function loadModule(): Promise<AdminModule> {
  return import('../src/engine/shared/firestoreBackend/firebaseAdmin');
}

function mockConfigFile(contents: Record<string, unknown> | null) {
  vi.spyOn(fs, 'existsSync').mockReturnValue(contents !== null);
  vi.spyOn(fs, 'readFileSync').mockImplementation(
    () => JSON.stringify(contents ?? {}) as never
  );
}

describe('firestoreBackend/firebaseAdmin (generalized from HoK)', () => {
  beforeEach(() => {
    vi.resetModules();
    adminSdk.initializeApp
      .mockReset()
      .mockImplementation((options: unknown) => ({ name: '[DEFAULT]', options }));
    adminSdk.getApps.mockReset().mockReturnValue([]);
    adminSdk.getFirestore
      .mockReset()
      .mockImplementation((databaseId?: string) => ({ databaseId }));
    adminSdk.getAuth.mockReset().mockReturnValue({ auth: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initFirebaseAdmin', () => {
    it('initializes the app with projectId from the config file', async () => {
      mockConfigFile({ projectId: 'proj-from-file' });
      const { initFirebaseAdmin } = await loadModule();
      const app = initFirebaseAdmin();
      expect(adminSdk.initializeApp).toHaveBeenCalledTimes(1);
      expect(adminSdk.initializeApp).toHaveBeenCalledWith({
        projectId: 'proj-from-file',
      });
      expect(app).toBe(adminSdk.initializeApp.mock.results[0].value);
    });

    it('looks for firebase-applet-config.json under process.cwd() by default', async () => {
      mockConfigFile(null);
      const { initFirebaseAdmin } = await loadModule();
      initFirebaseAdmin();
      expect(fs.existsSync).toHaveBeenCalledWith(
        path.resolve(process.cwd(), 'firebase-applet-config.json')
      );
    });

    it('honors a custom configPath', async () => {
      mockConfigFile(null);
      const { configureFirebaseAdmin, initFirebaseAdmin } = await loadModule();
      configureFirebaseAdmin({ configPath: 'custom/firebase.json' });
      initFirebaseAdmin();
      expect(fs.existsSync).toHaveBeenCalledWith(
        path.resolve(process.cwd(), 'custom/firebase.json')
      );
    });

    it('falls back to fallbackProjectId when the config file is absent', async () => {
      mockConfigFile(null);
      const { configureFirebaseAdmin, initFirebaseAdmin } = await loadModule();
      configureFirebaseAdmin({ fallbackProjectId: 'fallback-proj' });
      initFirebaseAdmin();
      expect(adminSdk.initializeApp).toHaveBeenCalledWith({
        projectId: 'fallback-proj',
      });
    });

    it('uses an empty projectId when neither the file nor a fallback provides one', async () => {
      mockConfigFile(null);
      const { initFirebaseAdmin } = await loadModule();
      initFirebaseAdmin();
      expect(adminSdk.initializeApp).toHaveBeenCalledWith({ projectId: '' });
    });

    it('reuses an already-registered app instead of initializing a new one', async () => {
      const existing = { name: '[DEFAULT]', preexisting: true };
      adminSdk.getApps.mockReturnValue([existing]);
      const { initFirebaseAdmin } = await loadModule();
      const app = initFirebaseAdmin();
      expect(adminSdk.initializeApp).not.toHaveBeenCalled();
      expect(app).toBe(existing);
    });

    it('memoizes the app across calls', async () => {
      mockConfigFile(null);
      const { initFirebaseAdmin } = await loadModule();
      const first = initFirebaseAdmin();
      const second = initFirebaseAdmin();
      expect(second).toBe(first);
      expect(adminSdk.initializeApp).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDb', () => {
    it('passes firestoreDatabaseId from the config file to getFirestore', async () => {
      mockConfigFile({ projectId: 'p', firestoreDatabaseId: 'named-db' });
      const { getDb } = await loadModule();
      getDb();
      expect(adminSdk.getFirestore).toHaveBeenCalledWith('named-db');
    });

    it("uses the '(default)' database when the config has no database id", async () => {
      mockConfigFile({ projectId: 'p' });
      const { getDb } = await loadModule();
      getDb();
      expect(adminSdk.getFirestore).toHaveBeenCalledWith('(default)');
    });

    it('memoizes the Firestore instance', async () => {
      mockConfigFile(null);
      const { getDb } = await loadModule();
      const first = getDb();
      const second = getDb();
      expect(second).toBe(first);
      expect(adminSdk.getFirestore).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAdminAuth', () => {
    it('initializes the app and returns the admin Auth instance', async () => {
      mockConfigFile(null);
      const { getAdminAuth } = await loadModule();
      const auth = getAdminAuth();
      expect(adminSdk.initializeApp).toHaveBeenCalledTimes(1);
      expect(adminSdk.getAuth).toHaveBeenCalledTimes(1);
      expect(auth).toBe(adminSdk.getAuth.mock.results[0].value);
    });
  });
});
