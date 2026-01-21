import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export interface AuthRequest extends Request {
    user?: {
        userId: number;
        email: string;
    };
}

/**
 * Middleware для проверки JWT токена
 */
export const authenticate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Получаем токен из заголовка Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Токен не предоставлен' });
        }

        // Формат: "Bearer TOKEN"
        const token = authHeader.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Токен не предоставлен' });
        }

        // Проверяем токен
        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: number;
            email: string;
        };

        // Добавляем данные пользователя в request
        req.user = decoded;

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            logger.warn(`Токен истёк: ${req.ip}`);
            return res.status(401).json({ error: 'Токен истёк' });
        }

        if (error instanceof jwt.JsonWebTokenError) {
            logger.warn(`Недействительный токен: ${req.ip}`);
            return res.status(401).json({ error: 'Недействительный токен' });
        }

        logger.error('Ошибка при проверке токена:', error);
        res.status(500).json({ error: 'Ошибка авторизации' });
    }
};

/**
 * Optional auth - не блокирует запрос, но добавляет user если токен валиден
 */
export const optionalAuth = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const decoded = jwt.verify(token, JWT_SECRET) as {
                userId: number;
                email: string;
            };
            req.user = decoded;
        }

        next();
    } catch (error) {
        // Игнорируем ошибки, просто не добавляем user
        next();
    }
};