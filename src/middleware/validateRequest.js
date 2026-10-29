import { ZodObject } from 'zod';

export const validateRequest = (schemas = {}) => {
  return async (req, res, next) => {
    try {
      if (schemas instanceof ZodObject && schemas.shape) {
        if (schemas.shape.params) {
          req.params = await schemas.shape.params.parseAsync(req.params);
        }
        if (schemas.shape.query) {
          req.query = await schemas.shape.query.parseAsync(req.query);
        }
        if (schemas.shape.body) {
          req.body = await schemas.shape.body.parseAsync(req.body);
        }
      } else {
        if (schemas.params) {
          req.params = await schemas.params.parseAsync(req.params);
        }
        if (schemas.query) {
          req.query = await schemas.query.parseAsync(req.query);
        }
        if (schemas.body) {
          req.body = await schemas.body.parseAsync(req.body);
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validateRequest;
