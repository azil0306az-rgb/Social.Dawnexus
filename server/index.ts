import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { mcpRouter } from './mcpServer.js';
import { apiRouter } from './routes/apiRouter.js';
import { pool, query } from './db.js';
import { startBackgroundScheduler, stopBackgroundScheduler } from './scheduler.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3006', 10);

app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allows Vite dev and remote MCP transport
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check Endpoint (Verifies real Supabase database)
app.get('/api/health', async (_req, res) => {
  try {
    const dbRes = await query('SELECT count(*) as count FROM social_workspaces');
    res.json({
      status: 'healthy',
      version: '1.0.0',
      service: 'Dawnexus Social Production API & MCP Gateway',
      database: 'Supabase PostgreSQL (Connected)',
      workspacesCount: Number(dbRes.rows[0].count),
      timestamp: new Date().toISOString(),
      node: 'social.dawnexus.in'
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'degraded',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mount Routes
app.use('/api', apiRouter);
app.use('/mcp', mcpRouter);

// Production Static Serving
const distPath = path.resolve('dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/mcp')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server & Scheduler (when running standalone)
if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`[Dawnexus Social v1.0.0] Production Server running on port ${PORT}`);
    console.log(`[Dawnexus Social v1.0.0] Remote MCP SSE Endpoint: http://localhost:${PORT}/mcp/sse`);

    // Start background publishing worker
    startBackgroundScheduler(30000);
  });

  // Graceful Shutdown
  process.on('SIGTERM', async () => {
    console.log('[Shutdown] SIGTERM received. Closing background scheduler and pool...');
    stopBackgroundScheduler();
    server.close(() => {
      pool.end();
      process.exit(0);
    });
  });
}

export default app;
