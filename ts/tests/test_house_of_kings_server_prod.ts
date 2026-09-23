import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const mocks = vi.hoisted(() => {
  const app = {
    use: vi.fn(),
    get: vi.fn(),
    listen: vi.fn(),
  };
  const expressFn: any = vi.fn();
  expressFn.json = vi.fn();
  expressFn.static = vi.fn();
  return {
    app,
    expressFn,
    getDb: vi.fn(),
    taskRouter: { router: 'task' },
    economyRouter: { router: 'economy' },
    adminRouter: { router: 'admin' },
    kingdomRouter: { router: 'kingdom' },
    workerRouter: { router: 'worker' },
    houseRouter: { router: 'house' },
  };
});

vi.mock('express', () => ({ default: mocks.expressFn }));

vi.mock('../src/games/house_of_kings_collab/server/routes/taskRoutes', () => ({
  taskRouter: mocks.taskRouter,
}));
vi.mock('../src/games/house_of_kings_collab/server/routes/economyRoutes', () => ({
  economyRouter: mocks.economyRouter,
}));
vi.mock('../src/games/house_of_kings_collab/server/routes/adminRoutes', () => ({
  adminRouter: mocks.adminRouter,
}));
vi.mock('../src/games/house_of_kings_collab/server/routes/kingdomRoutes', () => ({
  kingdomRouter: mocks.kingdomRouter,
}));
vi.mock('../src/games/house_of_kings_collab/server/routes/workerRoutes', () => ({
  workerRouter: mocks.workerRouter,
}));
vi.mock('../src/games/house_of_kings_collab/server/routes/houseRoutes', () => ({
  houseRouter: mocks.houseRouter,
}));
vi.mock('../src/games/house_of_kings_collab/server/lib/firebaseAdmin', () => ({
  getDb: mocks.getDb,
}));

const PRIMARY_CONFIG = path.resolve(
  process.cwd(),
  'src/games/house_of_kings_collab/firebase-applet-config.json'
);
const ALT_CONFIG = path.resolve(process.cwd(), 'firebase-applet-config.json');
const DIST_PATH = path.join(process.cwd(), 'dist');
const INDEX_PATH = path.join(DIST_PATH, 'index.html');

async function loadServer() {
  await import('../src/games/house_of_kings_collab/server/server.prod');
  return mocks.app;
}

/** Map of absolute path -> JSON contents (object) or existence-only marker (true). */
function mockFs(files: Record<string, Record<string, unknown> | true>) {
  const present = new Set(Object.keys(files));
  vi.spyOn(fs, 'existsSync').mockImplementation((p) => present.has(String(p)));
  vi.spyOn(fs, 'readFileSync').mockImplementation(
    (p) => JSON.stringify(files[String(p)] === true ? {} : files[String(p)] ?? {}) as never
  );
}

function corsMiddleware() {
  return mocks.app.use.mock.calls[0][0] as (req: any, res: any, next: any) => void;
}

function routeHandler(route: string) {
  const call = mocks.app.get.mock.calls.find(([p]) => p === route);
  if (!call) throw new Error(`no GET handler registered for ${route}`);
  return call[1] as (req: any, res: any) => unknown;
}

function mockRes() {
  const res: any = {
    setHeader: vi.fn(),
    status: vi.fn(),
    end: vi.fn(),
    json: vi.fn(),
    sendFile: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

function healthyDb() {
  const get = vi.fn().mockResolvedValue({ exists: true });
  const doc = vi.fn(() => ({ get }));
  const collection = vi.fn(() => ({ doc }));
  mocks.getDb.mockReturnValue({ collection });
  return { get, doc, collection };
}

describe('house_of_kings_collab server.prod', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.app.use.mockReset();
    mocks.app.get.mockReset();
    mocks.app.listen.mockReset();
    mocks.expressFn.mockReset().mockImplementation(() => mocks.app);
    mocks.expressFn.json.mockReset().mockReturnValue('express.json()');
    mocks.expressFn.static
      .mockReset()
      .mockImplementation((p: string) => ({ staticPath: p }));
    mocks.getDb.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('firebase config resolution', () => {
    it('uses projectId and firestoreDatabaseId from the game config file', async () => {
      mockFs({
        [PRIMARY_CONFIG]: {
          projectId: 'proj-primary',
          firestoreDatabaseId: 'db-primary',
        },
      });
      healthyDb();
      await loadServer();

      const res = mockRes();
      await routeHandler('/api/health')({}, res);

      expect(res.json).toHaveBeenCalledWith({
        status: 'ok',
        projectId: 'proj-primary',
        databaseId: 'db-primary',
        adminSdkConnected: true,
        adminSdkError: null,
      });
      expect(fs.existsSync).not.toHaveBeenCalledWith(ALT_CONFIG);
    });

    it('falls back to the cwd-root config when the game config lacks projectId', async () => {
      mockFs({
        [PRIMARY_CONFIG]: { apiKey: 'key-only' },
        [ALT_CONFIG]: {
          projectId: 'proj-alt',
          firestoreDatabaseId: 'db-alt',
        },
      });
      healthyDb();
      await loadServer();

      const res = mockRes();
      await routeHandler('/api/health')({}, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'proj-alt',
          databaseId: 'db-alt',
        })
      );
    });

    it('uses the hardcoded defaults when no config file exists', async () => {
      mockFs({});
      healthyDb();
      await loadServer();

      const res = mockRes();
      await routeHandler('/api/health')({}, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'youtubeauto-497203',
          databaseId: '(default)',
        })
      );
    });
  });

  describe('listen', () => {
    it('listens on port 8080 by default', async () => {
      vi.stubEnv('PORT', '');
      mockFs({});
      await loadServer();

      expect(mocks.app.listen).toHaveBeenCalledWith(
        8080,
        '0.0.0.0',
        expect.any(Function)
      );
    });

    it('listens on process.env.PORT when set', async () => {
      vi.stubEnv('PORT', '9090');
      mockFs({});
      await loadServer();

      expect(mocks.app.listen).toHaveBeenCalledWith(
        9090,
        '0.0.0.0',
        expect.any(Function)
      );
    });

    it('logs the bound address when the listen callback fires', async () => {
      vi.stubEnv('PORT', '9090');
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockFs({});
      await loadServer();

      const callback = mocks.app.listen.mock.calls[0][2] as () => void;
      callback();

      expect(log).toHaveBeenCalledWith(
        'House of Kings Server running on http://0.0.0.0:9090'
      );
    });
  });

  describe('CORS middleware', () => {
    it('echoes an allowed origin with the full header set', async () => {
      mockFs({});
      await loadServer();

      const res = mockRes();
      const next = vi.fn();
      corsMiddleware()(
        { headers: { origin: 'https://rfditservices.com' }, method: 'GET' },
        res,
        next
      );

      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://rfditservices.com'
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      );
      expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Origin');
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('allows the localhost dev origin', async () => {
      mockFs({});
      await loadServer();

      const res = mockRes();
      const next = vi.fn();
      corsMiddleware()(
        { headers: { origin: 'http://localhost:5173' }, method: 'GET' },
        res,
        next
      );

      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'http://localhost:5173'
      );
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('sets no CORS headers for a disallowed origin but still calls next', async () => {
      mockFs({});
      await loadServer();

      const res = mockRes();
      const next = vi.fn();
      corsMiddleware()(
        { headers: { origin: 'https://evil.example.com' }, method: 'GET' },
        res,
        next
      );

      expect(res.setHeader).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('sets no CORS headers when the Origin header is absent', async () => {
      mockFs({});
      await loadServer();

      const res = mockRes();
      const next = vi.fn();
      corsMiddleware()({ headers: {}, method: 'GET' }, res, next);

      expect(res.setHeader).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('answers OPTIONS preflight with 204 and does not call next', async () => {
      mockFs({});
      await loadServer();

      const res = mockRes();
      const next = vi.fn();
      corsMiddleware()(
        { headers: { origin: 'https://rfditservices.com' }, method: 'OPTIONS' },
        res,
        next
      );

      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://rfditservices.com'
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(next).not.toHaveBeenCalled();
    });

    it('still answers OPTIONS with 204 for a disallowed origin, without CORS headers', async () => {
      mockFs({});
      await loadServer();

      const res = mockRes();
      const next = vi.fn();
      corsMiddleware()(
        { headers: { origin: 'https://evil.example.com' }, method: 'OPTIONS' },
        res,
        next
      );

      expect(res.setHeader).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('middleware and router mounting', () => {
    it('installs express.json() body parsing', async () => {
      mockFs({});
      await loadServer();

      expect(mocks.expressFn.json).toHaveBeenCalledTimes(1);
      expect(mocks.app.use).toHaveBeenCalledWith('express.json()');
    });

    it('mounts the five domain routers bare and admin under /api/admin', async () => {
      mockFs({});
      await loadServer();

      const bareRouters = mocks.app.use.mock.calls
        .filter((call) => call.length === 1)
        .map((call) => call[0]);
      expect(bareRouters).toContain(mocks.taskRouter);
      expect(bareRouters).toContain(mocks.economyRouter);
      expect(bareRouters).toContain(mocks.kingdomRouter);
      expect(bareRouters).toContain(mocks.workerRouter);
      expect(bareRouters).toContain(mocks.houseRouter);
      expect(mocks.app.use).toHaveBeenCalledWith(
        '/api/admin',
        mocks.adminRouter
      );
    });
  });

  describe('/api/health', () => {
    it('probes the health_check/status doc and reports connected', async () => {
      mockFs({});
      const { collection, doc, get } = healthyDb();
      await loadServer();

      const res = mockRes();
      await routeHandler('/api/health')({}, res);

      expect(collection).toHaveBeenCalledWith('health_check');
      expect(doc).toHaveBeenCalledWith('status');
      expect(get).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({
        status: 'ok',
        projectId: 'youtubeauto-497203',
        databaseId: '(default)',
        adminSdkConnected: true,
        adminSdkError: null,
      });
    });

    it('reports adminSdkConnected=false with the message when getDb throws', async () => {
      mockFs({});
      mocks.getDb.mockImplementation(() => {
        throw new Error('admin init failed');
      });
      await loadServer();

      const res = mockRes();
      await routeHandler('/api/health')({}, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ok',
          adminSdkConnected: false,
          adminSdkError: 'admin init failed',
        })
      );
    });

    it('reports adminSdkConnected=false when the firestore probe rejects', async () => {
      mockFs({});
      const { get } = healthyDb();
      get.mockRejectedValue(new Error('firestore unreachable'));
      await loadServer();

      const res = mockRes();
      await routeHandler('/api/health')({}, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          adminSdkConnected: false,
          adminSdkError: 'firestore unreachable',
        })
      );
    });

    it('stringifies non-Error throwables into adminSdkError', async () => {
      mockFs({});
      mocks.getDb.mockImplementation(() => {
        throw 'string failure';
      });
      await loadServer();

      const res = mockRes();
      await routeHandler('/api/health')({}, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          adminSdkConnected: false,
          adminSdkError: 'string failure',
        })
      );
    });
  });

  describe('static serving and SPA fallback', () => {
    it('serves dist/ statically when the directory exists', async () => {
      mockFs({ [DIST_PATH]: true });
      await loadServer();

      expect(mocks.expressFn.static).toHaveBeenCalledWith(DIST_PATH);
      expect(mocks.app.use).toHaveBeenCalledWith({ staticPath: DIST_PATH });
    });

    it('skips express.static when dist/ is absent', async () => {
      mockFs({});
      await loadServer();

      expect(mocks.expressFn.static).not.toHaveBeenCalled();
    });

    it('serves dist/index.html from the catch-all when present', async () => {
      mockFs({ [DIST_PATH]: true, [INDEX_PATH]: true });
      await loadServer();

      const res = mockRes();
      routeHandler('/{*path}')({}, res);

      expect(res.sendFile).toHaveBeenCalledWith(INDEX_PATH);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('answers 404 JSON from the catch-all when index.html is absent', async () => {
      mockFs({});
      await loadServer();

      const res = mockRes();
      routeHandler('/{*path}')({}, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
    });
  });
});
