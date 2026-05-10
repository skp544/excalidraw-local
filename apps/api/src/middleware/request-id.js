import { nanoid } from 'nanoid';

/** Tag every request with a short id so logs can be correlated. */
export function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || nanoid(10);
  req.id = id;
  res.setHeader('x-request-id', id);
  next();
}
