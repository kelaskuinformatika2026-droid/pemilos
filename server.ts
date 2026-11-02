import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { app } from './src/server/app.ts';
import { isCloudSqlConfigured, syncLocalDataToCloudSql } from './src/server/cloudSqlService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function setupServer() {
  // Sync data to Cloud SQL on startup if configured
  if (isCloudSqlConfigured()) {
    syncLocalDataToCloudSql()
      .then((res) => {
        if (res.success) {
          console.log('[Cloud SQL] Data automatically synchronized to PostgreSQL.');
        } else {
          console.warn('[Cloud SQL] Automatic sync notice:', res.message);
        }
      })
      .catch((err) => {
        console.error('[Cloud SQL] Error during automatic startup sync:', err);
      });
  }

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server E-Voting OSIS SMA Pasundan 8 Bandung berjalan di http://localhost:${PORT}`);
  });
}

setupServer();
