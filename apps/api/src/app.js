import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import path from 'node:path';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { requestId } from './middleware/request-id.js';
import { generalLimiter } from './middleware/rate-limit.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '8mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());
  app.use(hpp());

  app.use(
    morgan(env.IS_PROD ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.info(msg.trim()) },
      skip: (req) => req.path === '/api/v1/health',
    }),
  );

  app.use(generalLimiter);

  // Static files for uploads (local-first storage).
  // We rely on helmet's CORP=cross-origin so the web app can render images.
  app.use(
    '/uploads',
    express.static(env.UPLOAD_ROOT, {
      maxAge: '7d',
      immutable: false,
      index: false,
      dotfiles: 'deny',
    }),
  );

  app.get('/healthz', (_req, res) => res.json({ ok: true, env: env.NODE_ENV }));

  app.use('/api/v1', apiRouter);

  app.use('/api', notFoundHandler);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// expose for tests
export const __dirnameForTests = path.dirname(new URL(import.meta.url).pathname);
