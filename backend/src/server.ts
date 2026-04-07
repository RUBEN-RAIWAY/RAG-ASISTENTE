import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import router from './api/routes';
import { errorHandler } from './api/middleware/errorHandler';

const app = express();
const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
const frontendPath = path.join(__dirname, '../..', 'frontend');
app.use(express.static(frontendPath));

// API routes
app.use('/api', router);

// SPA fallback — serve index.html for non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n RAG Assistant backend running on http://0.0.0.0:${PORT}`);
  console.log(` API endpoints:`);
  console.log(`   POST /api/documents/upload  — Upload a PDF`);
  console.log(`   GET  /api/documents/stats   — Pinecone index stats`);
  console.log(`   POST /api/chat/ask          — Ask a question`);
  console.log(`   GET  /api/health            — Health check\n`);
});

export default app;
