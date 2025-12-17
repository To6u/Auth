import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

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
                    details: error.errors.map((err) => ({
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