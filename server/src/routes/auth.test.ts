import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import db from '../db';

// Rate limiter — pass-through в тестах (shared state накапливается между тестами и вызывает 429)
vi.mock('../config/rate-limit.config', () => ({
    authLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
    apiLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import authRoutes from '../routes/auth.routes';

function createApp(): Express {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRoutes);
    return app;
}

const app = createApp();

beforeEach(() => {
    // Реальная БД в памяти — чистим между тестами
    db.prepare('DELETE FROM users').run();
});

describe('POST /api/auth/register', () => {
    it('201 — регистрирует нового пользователя', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'new@example.com', password: 'password123' });

        expect(res.status).toBe(201);
        expect(res.body.userId).toBeDefined();
    });

    it('400 — email уже существует', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ email: 'dup@example.com', password: 'password123' });

        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'dup@example.com', password: 'password123' });

        expect(res.status).toBe(400);
    });

    it('400 — невалидный email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'not-an-email', password: 'password123' });

        expect(res.status).toBe(400);
    });

    it('400 — пароль короче 6 символов', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'short@example.com', password: '123' });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/auth/login', () => {
    beforeEach(async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ email: 'user@example.com', password: 'correctpass' });
    });

    it('200 — вход с верными данными, устанавливает httpOnly cookie', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'user@example.com', password: 'correctpass' });

        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe('user@example.com');
        expect(res.body.user.id).toBeDefined();
        // Токен не должен быть в теле
        expect(res.body.token).toBeUndefined();
        // Cookie должна быть установлена
        const cookie = res.headers['set-cookie']?.[0] ?? '';
        expect(cookie).toContain('token=');
        expect(cookie).toContain('HttpOnly');
    });

    it('401 — неверный пароль', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'user@example.com', password: 'wrongpass' });

        expect(res.status).toBe(401);
    });

    it('401 — пользователь не существует', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@example.com', password: 'password123' });

        expect(res.status).toBe(401);
    });
});

describe('POST /api/auth/logout', () => {
    it('200 — очищает cookie', async () => {
        const res = await request(app).post('/api/auth/logout');

        expect(res.status).toBe(200);
        const cookie = res.headers['set-cookie']?.[0] ?? '';
        // Очищенная cookie содержит пустой token
        expect(cookie).toMatch(/token=;|token=$/);
    });
});
