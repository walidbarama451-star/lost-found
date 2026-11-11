import rateLimit from 'express-rate-limit';

const jsonMessage = (message: string) => ({ success: false as const, message, errors: [] });

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many attempts, please try again later'),
});

export const claimLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many claims submitted, please try again later'),
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many uploads, please try again later'),
});
