import { ApiError } from '../utils/ApiError.js';

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`, 'ENDPOINT_NOT_FOUND'));
};

export default notFoundHandler;
