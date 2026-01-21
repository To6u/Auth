import winston from 'winston';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Создаём папку logs если её нет
const logsDir = join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
    mkdirSync(logsDir);
}

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        if (stack) {
            return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
        }
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
);

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // Ошибки в отдельный файл
        new winston.transports.File({
            filename: join(logsDir, 'error.log'),
            level: 'error',
        }),
        // Все логи
        new winston.transports.File({
            filename: join(logsDir, 'combined.log'),
        }),
    ],
});

// В development - логи в консоль с цветами
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        })
    );
}