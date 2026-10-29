const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'confirmpassword',
  'newpassword',
  'currentpassword',
  'otp',
  'otpcode',
  'otphash',
  'code',
  'secret',
  'token',
  'accesstoken',
  'refreshtoken',
  'tokenhash',
  'authorization',
  'cookie',
  'setcookie',
  'xcsrftoken',
  'xxsrftoken',
  'razorpaysignature',
  'razorpaypaymentid',
  'razorpayorderid',
  'razorpaykeysecret',
  'keysecret',
  'cardnumber',
  'cvv',
  'creditcard'
]);

export const redactSensitive = (obj, depth = 0) => {
  if (!obj || typeof obj !== 'object' || depth > 6) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitive(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = key.toLowerCase().replace(/[-_]/g, '');

    if (SENSITIVE_KEYS.has(normalizedKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = redactSensitive(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

export default redactSensitive;
