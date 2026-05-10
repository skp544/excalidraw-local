/**
 * Wrap an async route handler so thrown errors propagate to the global
 * error middleware without try/catch boilerplate everywhere.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
