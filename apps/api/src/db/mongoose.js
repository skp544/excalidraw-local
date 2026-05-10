import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

mongoose.set('strictQuery', true);

let connectingPromise = null;

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectingPromise) return connectingPromise;

  logger.info({ uri: redact(env.MONGO_URI) }, 'connecting to mongo');

  connectingPromise = mongoose
    .connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 8_000,
      maxPoolSize: 20,
      autoIndex: !env.IS_PROD,
    })
    .then((conn) => {
      logger.info('mongo connected');
      conn.connection.on('error', (err) => logger.error({ err }, 'mongo connection error'));
      conn.connection.on('disconnected', () => logger.warn('mongo disconnected'));
      return conn.connection;
    })
    .catch((err) => {
      connectingPromise = null;
      logger.error({ err }, 'mongo connection failed');
      throw err;
    });

  return connectingPromise;
}

export async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

function redact(uri) {
  try {
    const url = new URL(uri);
    if (url.password) url.password = '***';
    return url.toString();
  } catch {
    return uri;
  }
}
