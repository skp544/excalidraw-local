/**
 * Validate request properties (body / query / params) against a zod schema.
 * The validated value replaces the original property so downstream handlers
 * see the parsed/coerced shape.
 *
 *     router.post('/', validate({ body: schema }), handler);
 */
export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.query) req.query = schemas.query.parse(req.query);
    if (schemas.params) req.params = schemas.params.parse(req.params);
    next();
  } catch (err) {
    next(err);
  }
};
