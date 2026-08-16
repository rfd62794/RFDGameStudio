import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { taskRouter } from './routes/taskRoutes';
import { economyRouter } from './routes/economyRoutes';
import { adminRouter } from './routes/adminRoutes';
import { kingdomRouter } from './routes/kingdomRoutes';
import { workerRouter } from './routes/workerRoutes';
import { houseRouter } from './routes/houseRoutes';
import { getDb } from './lib/firebaseAdmin';

// Read firebase applet config
const configPath = path.resolve(process.cwd(), 'src/games/house_of_kings_collab/firebase-applet-config.json');
let firebaseConfig: any = {};
if (fs.existsSync(configPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

const projectId = firebaseConfig.projectId || 'youtubeauto-497203';
const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '8080', 10);

  app.use(express.json());

  // API Route: Health check with dedicated Admin SDK connectivity check
  app.get('/api/health', async (_req, res) => {
    let adminSdkConnected = false;
    let adminSdkError: string | null = null;
    try {
      const db = getDb();
      await db.collection('health_check').doc('status').get();
      adminSdkConnected = true;
    } catch (err: any) {
      adminSdkError = err.message || String(err);
    }

    res.json({
      status: 'ok',
      projectId,
      databaseId,
      adminSdkConnected,
      adminSdkError,
    });
  });


  // Mount Task, Economy, Admin, Kingdom, Worker, and House Routers
  app.use(taskRouter);
  app.use(economyRouter);
  app.use(kingdomRouter);
  app.use(workerRouter);
  app.use(houseRouter);
  app.use('/api/admin', adminRouter);

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`House of Kings Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
