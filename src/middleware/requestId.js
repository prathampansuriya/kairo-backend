import crypto from 'crypto';

export const requestId = (req, res, next) => {
  const incomingId = req.headers['x-request-id'];
  const currentId = incomingId && typeof incomingId === 'string' && incomingId.trim().length > 0
    ? incomingId.trim()
    : crypto.randomUUID();

  req.id = currentId;
  res.setHeader('X-Request-Id', currentId);
  next();
};

export default requestId;
