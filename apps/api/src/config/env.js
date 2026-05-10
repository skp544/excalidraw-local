import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = (name, fallback = undefined) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`[env] missing required variable: ${name}`);
  }
  return value;
};

const int = (name, fallback) => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) throw new Error(`[env] ${name} must be an integer`);
  return value;
};

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  IS_PROD: process.env.NODE_ENV === 'production',
  PORT: int('PORT', 7051),

  MONGO_URI: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/excalidrow',

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET', 'dev-access-secret-please-change'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET', 'dev-refresh-secret-please-change'),
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL ?? '15m',
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL ?? '30d',

  WEB_ORIGIN: process.env.WEB_ORIGIN ?? 'http://localhost:7001',

  UPLOAD_ROOT: path.resolve(
    __dirname,
    '../../',
    process.env.UPLOAD_ROOT ?? '../../uploads',
  ),
  MAX_UPLOAD_BYTES: int('MAX_UPLOAD_BYTES', 25 * 1024 * 1024),

  RATE_LIMIT_WINDOW_MS: int('RATE_LIMIT_WINDOW_MS', 60_000),
  RATE_LIMIT_MAX: int('RATE_LIMIT_MAX', 300),

  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
});
