import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectMongo, disconnectMongo } from './db/mongoose.js';
import { ensureStorageDirs } from './services/storage.service.js';
import { attachSockets } from './sockets/index.js';

async function start() {
  await ensureStorageDirs();
  await connectMongo();

  const app = createApp();
  const httpServer = http.createServer(app);
  attachSockets(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'excalidrow api ready');
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, 'shutting down');
    httpServer.close(() => logger.info('http server closed'));
    await disconnectMongo();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error({ err }, 'failed to start api');
  process.exit(1);
});
