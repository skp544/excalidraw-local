/**
 * Domain error classes used across services. Controllers throw these
 * and the global error middleware turns them into JSON responses.
 */

export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Bad request', details) {
    return new HttpError(400, 'BAD_REQUEST', message, details);
  }
  static unauthorized(message = 'Unauthorized') {
    return new HttpError(401, 'UNAUTHORIZED', message);
  }
  static forbidden(message = 'Forbidden') {
    return new HttpError(403, 'FORBIDDEN', message);
  }
  static notFound(message = 'Not found') {
    return new HttpError(404, 'NOT_FOUND', message);
  }
  static conflict(message = 'Conflict', details) {
    return new HttpError(409, 'CONFLICT', message, details);
  }
  static unprocessable(message = 'Unprocessable entity', details) {
    return new HttpError(422, 'UNPROCESSABLE', message, details);
  }
  static tooLarge(message = 'Payload too large') {
    return new HttpError(413, 'PAYLOAD_TOO_LARGE', message);
  }
  static rateLimited(message = 'Too many requests') {
    return new HttpError(429, 'RATE_LIMITED', message);
  }
}
