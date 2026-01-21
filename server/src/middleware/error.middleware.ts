import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Логируем ошибку
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
    });

    // В production не показываем детали ошибки
    const message =
        process.env.NODE_ENV === 'production'
            ? 'Внутренняя ошибка сервера'
            : err.message;

    res.status(500).json({
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};

// Обработчик для несуществующих роутов
export const notFoundHandler = (req: Request, res: Response) => {
    logger.warn(`404 - Роут не найден: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Роут не найден' });
};