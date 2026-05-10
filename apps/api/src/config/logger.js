import pino from 'pino';
import { env } from './env.js';

const transport =
  env.IS_PROD
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      };

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { svc: 'excalidrow-api' },
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.refreshToken'],
  transport,
});
