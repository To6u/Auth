import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authLimiter } from '../config/rate-limit.config';
import db from '../db';
import { logger } from '../utils/logger';
import { loginSchema, registerSchema, validateRequest } from '../validation/auth.validation';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * POST /api/auth/register
 * Регистрация нового пользователя
 */
router.post('/register', authLimiter, validateRequest(registerSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Проверка существования пользователя
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

        if (existingUser) {
            return res.status(400).json({
                error: 'Пользователь с таким email уже существует',
            });
        }

        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 12);

        // Сохраняем пользователя
        const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
        const result = stmt.run(email, hashedPassword);

        logger.info(`Новый пользователь зарегистрирован: ${email}`);

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            userId: result.lastInsertRowid,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/login
 * Вход пользователя
 */
router.post('/login', authLimiter, validateRequest(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Ищем пользователя
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        const user = stmt.get(email) as any;

        if (!user) {
            logger.warn(`Неудачная попытка входа: пользователь не найден - ${email}`);
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        // Проверяем пароль
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            logger.warn(`Неудачная попытка входа: неверный пароль - ${email}`);
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        // Создаём JWT токен
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: '24h',
        });

        logger.info(`Успешный вход: ${email}`);

        // Устанавливаем httpOnly cookie — токен недоступен для JS
        res.cookie('token', token, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24h — совпадает с JWT expiresIn
            path: '/',
        });

        // Токен НЕ возвращается в теле ответа
        res.json({
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.created_at,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/check-email
 * Проверка существования email для восстановления пароля
 */
router.post('/check-email', authLimiter, async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email обязателен' });
        }

        // Проверяем существование пользователя
        const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
        const user = stmt.get(email) as { id: number } | undefined;

        if (!user) {
            logger.warn(`Попытка восстановления пароля для несуществующего email: ${email}`);
            return res.status(404).json({ error: 'Пользователь с таким email не найден' });
        }

        logger.info(`Email найден для восстановления пароля: ${email}`);

        res.json({
            message: 'Email найден',
            emailExists: true,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/reset-password
 * Сброс пароля
 */
router.post('/reset-password', authLimiter, async (req, res, next) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ error: 'Email и новый пароль обязательны' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
        }

        // Проверяем существование пользователя
        const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
        const user = checkStmt.get(email) as { id: number } | undefined;

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Хешируем новый пароль
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Обновляем пароль
        const updateStmt = db.prepare('UPDATE users SET password = ? WHERE email = ?');
        updateStmt.run(hashedPassword, email);

        logger.info(`Пароль успешно сброшен для: ${email}`);

        res.json({
            message: 'Пароль успешно изменён',
            success: true,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/logout
 * Выход пользователя — очищает httpOnly cookie
 */
router.post('/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, path: '/' });
    res.json({ message: 'Logged out successfully' });
});

export default router;
