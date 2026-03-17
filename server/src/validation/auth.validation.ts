import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

// Схемы валидации
export const registerSchema = z.object({
    email: z.string().email('Некорректный email').min(1, 'Email обязателен'),
    password: z
        .string()
        .min(6, 'Пароль должен быть минимум 6 символов')
        .max(100, 'Пароль слишком длинный'),
});

export const loginSchema = z.object({
    email: z.string().email('Некорректный email').min(1, 'Email обязателен'),
    password: z.string().min(1, 'Пароль обязателен'),
});

// Middleware для валидации
export const validateRequest = <T>(schema: z.ZodSchema<T>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Ошибка валидации',
                    details: error.issues.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            next(error);
        }
    };
};
