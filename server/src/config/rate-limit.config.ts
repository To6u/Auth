import rateLimit from 'express-rate-limit';

// Rate limiter для auth endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 10, // максимум 10 попыток за 15 минут
    message: { error: 'Слишком много попыток входа. Попробуйте через 15 минут' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skip: () => process.env.NODE_ENV === 'development',
});

// Rate limiter для обычных API запросов
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов
    message: { error: 'Слишком много запросов. Попробуйте позже' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'development',
});
