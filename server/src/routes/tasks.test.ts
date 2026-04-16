import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import db from '../db';

vi.mock('../config/rate-limit.config', () => ({
    authLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
    apiLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import authRoutes from './auth.routes';
import tasksRoutes from './tasks.routes';

function createApp(): Express {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRoutes);
    app.use('/api/tasks', tasksRoutes);
    return app;
}

const app = createApp();

async function getAuthCookie(email = 'task@example.com', pass = 'password123'): Promise<string> {
    await request(app).post('/api/auth/register').send({ email, password: pass });
    const res = await request(app).post('/api/auth/login').send({ email, password: pass });
    return res.headers['set-cookie']?.[0] ?? '';
}

beforeEach(() => {
    db.prepare('DELETE FROM tasks').run();
    db.prepare('DELETE FROM sections').run();
    db.prepare('DELETE FROM users').run();
});

// Valid v4 UUIDs for tests
const TASK_ID = 'a1b2c3d4-e5f6-4000-8000-000000000001';

const baseTask = {
    id: TASK_ID,
    title: 'Купить молоко',
    description: '',
    sectionId: 'all',
    tags: [],
    status: 'active' as const,
    pinned: false,
    order: 0,
    createdAt: new Date().toISOString(),
};

describe('GET /api/tasks', () => {
    it('401 — без аутентификации', async () => {
        const res = await request(app).get('/api/tasks');
        expect(res.status).toBe(401);
    });

    it('200 — пустой список', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app).get('/api/tasks').set('Cookie', cookie);
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});

describe('POST /api/tasks', () => {
    it('201 — создаёт задачу', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app)
            .post('/api/tasks')
            .set('Cookie', cookie)
            .send(baseTask);

        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Купить молоко');
        expect(res.body.status).toBe('active');
    });

    it('400 — пустой title', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app)
            .post('/api/tasks')
            .set('Cookie', cookie)
            .send({ ...baseTask, title: '' });

        expect(res.status).toBe(400);
    });

    it('GET после POST — задача в списке', async () => {
        const cookie = await getAuthCookie();
        await request(app).post('/api/tasks').set('Cookie', cookie).send(baseTask);
        const res = await request(app).get('/api/tasks').set('Cookie', cookie);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].title).toBe('Купить молоко');
    });

    it('изоляция — второй пользователь не видит задачи первого', async () => {
        const cookie1 = await getAuthCookie('user1@test.com');
        const cookie2 = await getAuthCookie('user2@test.com');

        await request(app).post('/api/tasks').set('Cookie', cookie1).send(baseTask);

        const res = await request(app).get('/api/tasks').set('Cookie', cookie2);
        expect(res.body).toHaveLength(0);
    });
});

describe('PUT /api/tasks/:id', () => {
    it('200 — помечает задачу выполненной', async () => {
        const cookie = await getAuthCookie();
        await request(app).post('/api/tasks').set('Cookie', cookie).send(baseTask);

        const res = await request(app)
            .put(`/api/tasks/${TASK_ID}`)
            .set('Cookie', cookie)
            .send({ ...baseTask, status: 'done' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('done');
    });

    it('200 — обновляет title', async () => {
        const cookie = await getAuthCookie();
        await request(app).post('/api/tasks').set('Cookie', cookie).send(baseTask);

        const res = await request(app)
            .put(`/api/tasks/${TASK_ID}`)
            .set('Cookie', cookie)
            .send({ ...baseTask, title: 'Купить хлеб' });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Купить хлеб');
    });

    it('404 — несуществующий id', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app)
            .put('/api/tasks/a1b2c3d4-e5f6-4000-8000-000000000099')
            .set('Cookie', cookie)
            .send({ ...baseTask, id: 'a1b2c3d4-e5f6-4000-8000-000000000099' });

        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/tasks/:id', () => {
    it('204 — удаляет задачу', async () => {
        const cookie = await getAuthCookie();
        await request(app).post('/api/tasks').set('Cookie', cookie).send(baseTask);

        const del = await request(app)
            .delete(`/api/tasks/${TASK_ID}`)
            .set('Cookie', cookie);
        expect(del.status).toBe(204);

        const list = await request(app).get('/api/tasks').set('Cookie', cookie);
        expect(list.body).toHaveLength(0);
    });

    it('404 — несуществующий id', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app)
            .delete('/api/tasks/a1b2c3d4-e5f6-4000-8000-000000000099')
            .set('Cookie', cookie);
        expect(res.status).toBe(404);
    });
});
