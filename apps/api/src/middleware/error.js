import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { logger } from '../config/logger.js';
import { HttpError } from '../utils/errors.js';

export function notFoundHandler(req, res, _next) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    logger.warn({ err, path: req.path }, 'http error');
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      error: { code: 'BAD_REQUEST', message: `Invalid ${err.path}: ${err.value}` },
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Database validation failed',
        details: Object.fromEntries(
          Object.entries(err.errors).map(([k, v]) => [k, v.message]),
        ),
      },
    });
    return;
  }

  if (err && err.code === 11000) {
    res.status(409).json({
      error: { code: 'CONFLICT', message: 'Duplicate value', details: err.keyValue },
    });
    return;
  }

  // multer
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Upload too large' } });
    return;
  }

  logger.error({ err }, 'unhandled error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  });
}
