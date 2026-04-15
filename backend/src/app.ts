import express from 'express';
import cors from 'cors';
import path from 'path';
import { router } from './routes';

export function createApp() {
  const app = express();

  // ─── Middlewares globaux ──────────────────────────────────────────────────
  app.use(cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ─── Fichiers statiques (uploads + PDFs téléchargeables) ─────────────────
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  app.use('/pdfs',    express.static(path.join(process.cwd(), 'pdfs')));

  // ─── Routes API ───────────────────────────────────────────────────────────
  app.use('/api', router);

  // ─── Health check ─────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ─── 404 ─────────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route introuvable' });
  });

  // ─── Erreurs globales ─────────────────────────────────────────────────────
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[ERROR]', err);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
  });

  return app;
}
