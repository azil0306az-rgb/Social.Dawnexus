import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { mcpRouter } from './mcpServer.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3006;

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'Dawnexus Social API & MCP Gateway',
    timestamp: new Date().toISOString(),
    node: 'social.dawnexus.in',
    version: '1.0.0'
  });
});

// Mount Model Context Protocol (MCP) Router
app.use('/mcp', mcpRouter);

// API Mock / Fallback routes for multi-tenant state
app.get('/api/meta/status', (_req, res) => {
  res.json({
    platform: 'Meta Graph API',
    apiVersion: 'v21.0',
    appMode: process.env.NODE_ENV === 'production' ? 'Live' : 'Development / Sandbox',
    supportedFeatures: ['Pages Feed', 'Instagram Business Container', 'Ad Accounts Insights'],
    reviewStatus: 'Ready for App Review'
  });
});

app.get('/api/linkedin/status', (_req, res) => {
  res.json({
    platform: 'LinkedIn REST API',
    apiVersion: '202602',
    supportedFeatures: ['Share on LinkedIn', 'Organization Posts (Community Management)'],
    approvalStatus: 'Configured'
  });
});

// Production Static Serving
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Dawnexus Social] Server running on http://localhost:${PORT}`);
  console.log(`[Dawnexus Social] Remote MCP SSE Endpoint: http://localhost:${PORT}/mcp/sse`);
});
