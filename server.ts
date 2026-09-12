// FoodWise AI Server Entry Point
// Express + Vite Middleware with Port 3000

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db/index.ts';
import apiRouter from './server/routes/api.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize database / persistence engine
  await initDatabase();

  // Middleware for JSON parsing and large photo payloads (up to 25MB)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Request logger for API endpoints
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Mount API router FIRST before Vite middleware
  app.use('/api', apiRouter);

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FoodWise AI server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal startup error:', err);
});
