import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';

// Middleware для валидации
export const validateRequest = <T>(schema: ZodType<T, any, any>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: 'Ошибка валидации',
                    details: error.issues.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
};
