import { Router } from 'express';
import db from '../db';
import { type AuthRequest, authenticate } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/user/profile
 * Получить профиль текущего пользователя (защищённый роут)
 */
router.get('/profile', authenticate, (req: AuthRequest, res, next) => {
    try {
        const stmt = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?');
        const user = stmt.get(req.user!.userId);

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        logger.info(`Профиль запрошен: ${req.user!.email}`);

        res.json(user);
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/user/profile
 * Обновить профиль (пример защищённого роута)
 */
router.put('/profile', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email обязателен' });
        }

        // Проверяем, не занят ли email другим пользователем
        const existingUser = db
            .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
            .get(email, req.user!.userId);

        if (existingUser) {
            return res.status(400).json({ error: 'Email уже используется' });
        }

        // Обновляем email
        const stmt = db.prepare('UPDATE users SET email = ? WHERE id = ?');
        stmt.run(email, req.user!.userId);

        logger.info(`Профиль обновлён: ${req.user!.email} → ${email}`);

        res.json({ message: 'Профиль успешно обновлён', email });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/user/account
 * Удалить аккаунт (защищённый роут)
 */
router.delete('/account', authenticate, (req: AuthRequest, res, next) => {
    try {
        const stmt = db.prepare('DELETE FROM users WHERE id = ?');
        const result = stmt.run(req.user!.userId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        logger.info(`Аккаунт удалён: ${req.user!.email}`);

        res.json({ message: 'Аккаунт успешно удалён' });
    } catch (error) {
        next(error);
    }
});

export default router;
