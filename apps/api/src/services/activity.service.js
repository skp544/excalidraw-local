import { Activity } from '../models/Activity.js';
import { logger } from '../config/logger.js';

/**
 * Best-effort activity logger. Failures are swallowed so activity logging
 * never blocks the actual user-facing operation. The caller passes an
 * already-validated kind from ACTIVITY_KINDS.
 */
export async function logActivity({ actorId, kind, message, targetKind = null, targetId = null, metadata = {} }) {
  try {
    await Activity.create({ actorId, kind, message, targetKind, targetId, metadata });
  } catch (err) {
    logger.warn({ err, kind }, 'failed to write activity');
  }
}
