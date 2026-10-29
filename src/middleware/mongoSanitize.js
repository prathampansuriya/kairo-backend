const hasInjectionChar = (key) => {
  return key.startsWith('$') || key.includes('.');
};

const sanitize = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item));
  }

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (hasInjectionChar(key)) {
      // Strip forbidden NoSQL injection key
      continue;
    }
    clean[key] = sanitize(value);
  }
  return clean;
};

export const mongoSanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }
  next();
};

export default mongoSanitize;
