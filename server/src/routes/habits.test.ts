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
import habitsRoutes from './habits.routes';

function createApp(): Express {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRoutes);
    app.use('/api/habits', habitsRoutes);
    return app;
}

const app = createApp();

async function getAuthCookie(email = 'habit@example.com', pass = 'password123'): Promise<string> {
    await request(app).post('/api/auth/register').send({ email, password: pass });
    const res = await request(app).post('/api/auth/login').send({ email, password: pass });
    return res.headers['set-cookie']?.[0] ?? '';
}

beforeEach(() => {
    db.prepare('DELETE FROM habit_logs').run();
    db.prepare('DELETE FROM habits').run();
    db.prepare('DELETE FROM users').run();
});

const HABIT_ID = 'a1b2c3d4-e5f6-4000-8000-000000000001';

const baseHabit = {
    id: HABIT_ID,
    name: 'Зарядка',
    icon: '',
    color: '#6c8fff',
    overflowColor: '#4060cc',
    targetPerDay: 1,
    timeSlots: [],
    radius: 60,
    order: 0,
    createdAt: new Date().toISOString(),
};

describe('GET /api/habits', () => {
    it('401 — без аутентификации', async () => {
        const res = await request(app).get('/api/habits');
        expect(res.status).toBe(401);
    });

    it('200 — пустой список для нового пользователя', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app).get('/api/habits').set('Cookie', cookie);
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});

describe('POST /api/habits', () => {
    it('201 — создаёт привычку с пустым icon', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app)
            .post('/api/habits')
            .set('Cookie', cookie)
            .send(baseHabit);

        expect(res.status).toBe(201);
        expect(res.body.name).toBe('Зарядка');
        expect(res.body.icon).toBe('');
    });

    it('201 — создаёт привычку с emoji icon', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app)
            .post('/api/habits')
            .set('Cookie', cookie)
            .send({ ...baseHabit, icon: '🏋️' });

        expect(res.status).toBe(201);
        expect(res.body.icon).toBe('🏋️');
    });

    it('400 — пустое имя', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app)
            .post('/api/habits')
            .set('Cookie', cookie)
            .send({ ...baseHabit, name: '' });

        expect(res.status).toBe(400);
    });

    it('409 — дубль id', async () => {
        const cookie = await getAuthCookie();
        await request(app).post('/api/habits').set('Cookie', cookie).send(baseHabit);
        const res = await request(app).post('/api/habits').set('Cookie', cookie).send(baseHabit);
        expect(res.status).toBe(409);
    });

    it('GET после POST возвращает созданную привычку', async () => {
        const cookie = await getAuthCookie();
        await request(app).post('/api/habits').set('Cookie', cookie).send(baseHabit);
        const res = await request(app).get('/api/habits').set('Cookie', cookie);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].name).toBe('Зарядка');
    });
});

describe('PUT /api/habits/:id', () => {
    it('200 — обновляет имя привычки', async () => {
        const cookie = await getAuthCookie();
        await request(app).post('/api/habits').set('Cookie', cookie).send(baseHabit);

        const res = await request(app)
            .put(`/api/habits/${HABIT_ID}`)
            .set('Cookie', cookie)
            .send({ ...baseHabit, name: 'Бег' });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Бег');
    });

    it('404 — несуществующий id', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app)
            .put('/api/habits/a1b2c3d4-e5f6-4000-8000-000000000099')
            .set('Cookie', cookie)
            .send({ ...baseHabit, id: 'a1b2c3d4-e5f6-4000-8000-000000000099' });

        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/habits/:id', () => {
    it('204 — удаляет привычку', async () => {
        const cookie = await getAuthCookie();
        await request(app).post('/api/habits').set('Cookie', cookie).send(baseHabit);

        const del = await request(app)
            .delete(`/api/habits/${HABIT_ID}`)
            .set('Cookie', cookie);
        expect(del.status).toBe(204);

        const list = await request(app).get('/api/habits').set('Cookie', cookie);
        expect(list.body).toHaveLength(0);
    });

    it('404 — несуществующий id', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app)
            .delete('/api/habits/a1b2c3d4-e5f6-4000-8000-000000000099')
            .set('Cookie', cookie);
        expect(res.status).toBe(404);
    });
});

describe('POST /api/habits/logs/increment + decrement', () => {
    it('инкремент создаёт лог, декремент удаляет при completions=1', async () => {
        const cookie = await getAuthCookie();
        await request(app).post('/api/habits').set('Cookie', cookie).send(baseHabit);
        const date = '2026-04-06';

        const inc = await request(app)
            .post('/api/habits/logs/increment')
            .set('Cookie', cookie)
            .send({ habitId: HABIT_ID, date });
        expect(inc.status).toBe(200);
        expect(inc.body.completions).toBe(1);

        const dec = await request(app)
            .post('/api/habits/logs/decrement')
            .set('Cookie', cookie)
            .send({ habitId: HABIT_ID, date });
        expect(dec.status).toBe(200);
        expect(dec.body).toBeNull();
    });

    it('два инкремента → completions=2', async () => {
        const cookie = await getAuthCookie();
        await request(app).post('/api/habits').set('Cookie', cookie).send(baseHabit);
        const date = '2026-04-06';

        await request(app)
            .post('/api/habits/logs/increment')
            .set('Cookie', cookie)
            .send({ habitId: HABIT_ID, date });
        const res = await request(app)
            .post('/api/habits/logs/increment')
            .set('Cookie', cookie)
            .send({ habitId: HABIT_ID, date });

        expect(res.body.completions).toBe(2);
    });
});
