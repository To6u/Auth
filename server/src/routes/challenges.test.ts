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
import challengesRoutes from './challenges.routes';

function createApp(): Express {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRoutes);
    app.use('/api/challenges', challengesRoutes);
    return app;
}

const app = createApp();

async function getAuthCookie(
    email = 'challenge@example.com',
    pass = 'password123'
): Promise<string> {
    await request(app).post('/api/auth/register').send({ email, password: pass });
    const res = await request(app).post('/api/auth/login').send({ email, password: pass });
    return res.headers['set-cookie']?.[0] ?? '';
}

// Valid v4 UUIDs (3rd group starts with 4, 4th group starts with 8..b)
function uuid(n: number): string {
    const suffix = String(n).padStart(12, '0');
    return `a1b2c3d4-e5f6-4000-8000-${suffix}`;
}

function makeChallenge(n: number) {
    return {
        id: uuid(n),
        title: `Челлендж ${n}`,
        createdAt: new Date().toISOString(),
    };
}

beforeEach(() => {
    db.prepare('DELETE FROM challenge_assignments').run();
    db.prepare('DELETE FROM challenge_week_pools').run();
    db.prepare('DELETE FROM challenges').run();
    db.prepare('DELETE FROM users').run();
});

// --------------- Challenges CRUD ---------------

describe('GET /api/challenges', () => {
    it('401 — без аутентификации', async () => {
        const res = await request(app).get('/api/challenges');
        expect(res.status).toBe(401);
    });

    it('200 — пустой список', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app).get('/api/challenges').set('Cookie', cookie);
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});

describe('POST /api/challenges', () => {
    it('201 — создаёт челлендж', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app)
            .post('/api/challenges')
            .set('Cookie', cookie)
            .send(makeChallenge(1));

        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Челлендж 1');
    });

    it('400 — пустой title', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app)
            .post('/api/challenges')
            .set('Cookie', cookie)
            .send({ ...makeChallenge(1), title: '' });
        expect(res.status).toBe(400);
    });

    it('409 — дубль id', async () => {
        const cookie = await getAuthCookie();
        await request(app).post('/api/challenges').set('Cookie', cookie).send(makeChallenge(1));
        const res = await request(app)
            .post('/api/challenges')
            .set('Cookie', cookie)
            .send(makeChallenge(1));
        expect(res.status).toBe(409);
    });

    it('изоляция — второй пользователь не видит челленджи первого', async () => {
        const cookie1 = await getAuthCookie('c1@test.com');
        const cookie2 = await getAuthCookie('c2@test.com');

        await request(app).post('/api/challenges').set('Cookie', cookie1).send(makeChallenge(1));

        const res = await request(app).get('/api/challenges').set('Cookie', cookie2);
        expect(res.body).toHaveLength(0);
    });
});

describe('PUT /api/challenges/:id', () => {
    it('200 — обновляет title', async () => {
        const cookie = await getAuthCookie();
        await request(app).post('/api/challenges').set('Cookie', cookie).send(makeChallenge(1));

        const res = await request(app)
            .put(`/api/challenges/${uuid(1)}`)
            .set('Cookie', cookie)
            .send({ title: 'Обновлённый челлендж' });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Обновлённый челлендж');
    });

    it('404 — несуществующий id', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app)
            .put(`/api/challenges/${uuid(99)}`)
            .set('Cookie', cookie)
            .send({ title: 'X' });
        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/challenges/:id', () => {
    it('204 — удаляет челлендж', async () => {
        const cookie = await getAuthCookie();
        await request(app).post('/api/challenges').set('Cookie', cookie).send(makeChallenge(1));

        const del = await request(app)
            .delete(`/api/challenges/${uuid(1)}`)
            .set('Cookie', cookie);
        expect(del.status).toBe(204);

        const list = await request(app).get('/api/challenges').set('Cookie', cookie);
        expect(list.body).toHaveLength(0);
    });
});

// --------------- Week pools + assignments (today's challenge) ---------------

async function seed7Challenges(cookie: string) {
    for (let i = 1; i <= 7; i++) {
        await request(app).post('/api/challenges').set('Cookie', cookie).send(makeChallenge(i));
    }
}

describe('POST /api/challenges/daily-check — создаёт пул и назначение', () => {
    it('создаёт пул и назначение, GET /assignments возвращает сегодняшний', async () => {
        const cookie = await getAuthCookie();
        await seed7Challenges(cookie);

        const todayStr = new Date().toISOString().split('T')[0];

        const res = await request(app).post('/api/challenges/daily-check').set('Cookie', cookie);

        expect(res.status).toBe(200);

        const assignments = await request(app)
            .get('/api/challenges/assignments')
            .set('Cookie', cookie);

        expect(assignments.status).toBe(200);
        const today = (assignments.body as { date: string }[]).find((a) => a.date === todayStr);
        expect(today).toBeDefined();
        expect(today?.date).toBe(todayStr);
    });
});

describe('PUT /api/challenges/assignments/:id — отметить выполнено/провалено', () => {
    async function setupTodayAssignment(cookie: string): Promise<string> {
        await seed7Challenges(cookie);
        const res = await request(app).post('/api/challenges/daily-check').set('Cookie', cookie);
        const todayStr = new Date().toISOString().split('T')[0];
        const today = (res.body.assignments as { id: string; date: string }[]).find(
            (a) => a.date === todayStr
        );
        return today!.id;
    }

    it('200 — статус done', async () => {
        const cookie = await getAuthCookie();
        const assignmentId = await setupTodayAssignment(cookie);

        const res = await request(app)
            .put(`/api/challenges/assignments/${assignmentId}`)
            .set('Cookie', cookie)
            .send({ status: 'done', completedAt: new Date().toISOString() });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('done');
    });

    it('200 — статус failed', async () => {
        const cookie = await getAuthCookie();
        const assignmentId = await setupTodayAssignment(cookie);

        const res = await request(app)
            .put(`/api/challenges/assignments/${assignmentId}`)
            .set('Cookie', cookie)
            .send({ status: 'failed' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('failed');
    });

    it('404 — несуществующий assignment', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app)
            .put(`/api/challenges/assignments/${uuid(999)}`)
            .set('Cookie', cookie)
            .send({ status: 'done' });
        expect(res.status).toBe(404);
    });
});

function getWeekStart(): string {
    const date = new Date();
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    return monday.toISOString().split('T')[0];
}

// --------------- POST /daily-check ---------------

describe('POST /api/challenges/daily-check', () => {
    it('без челленджей — возвращает пустые assignments и null weekPool', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app).post('/api/challenges/daily-check').set('Cookie', cookie);
        expect(res.status).toBe(200);
        expect(res.body.assignments).toEqual([]);
        expect(res.body.weekPool).toBeNull();
    });

    it('с челленджами, нет пула — создаёт пул и assignment на сегодня', async () => {
        const cookie = await getAuthCookie();
        await seed7Challenges(cookie);

        const res = await request(app).post('/api/challenges/daily-check').set('Cookie', cookie);
        expect(res.status).toBe(200);
        expect(res.body.weekPool).not.toBeNull();
        expect(res.body.weekPool.challengeIds.length).toBeGreaterThan(0);

        const todayStr = new Date().toISOString().split('T')[0];
        const today = (res.body.assignments as { date: string }[]).find((a) => a.date === todayStr);
        expect(today).toBeDefined();
    });

    it('с active assignment от вчера — переводит в failed, создаёт новый на сегодня', async () => {
        const cookie = await getAuthCookie();
        await seed7Challenges(cookie);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Создаём пул вручную
        const challengeIds = Array.from({ length: 7 }, (_, i) => uuid(i + 1));
        db.prepare(
            `INSERT INTO challenge_week_pools (user_id, week_start, challenge_ids, confirmed_at)
             VALUES ((SELECT id FROM users WHERE email = 'challenge@example.com'), ?, ?, ?)`
        ).run(getWeekStart(), JSON.stringify(challengeIds), new Date().toISOString());

        // Создаём активный assignment на вчера
        const staleId = uuid(500);
        db.prepare(
            `INSERT INTO challenge_assignments (id, user_id, challenge_id, date, status, completed_at)
             VALUES (?, (SELECT id FROM users WHERE email = 'challenge@example.com'), ?, ?, 'active', NULL)`
        ).run(staleId, challengeIds[0], yesterdayStr);

        const res = await request(app).post('/api/challenges/daily-check').set('Cookie', cookie);
        expect(res.status).toBe(200);

        const stale = (res.body.assignments as { id: string; status: string }[]).find(
            (a) => a.id === staleId
        );
        expect(stale?.status).toBe('failed');

        const todayStr = new Date().toISOString().split('T')[0];
        const todayAssignment = (res.body.assignments as { date: string; status: string }[]).find(
            (a) => a.date === todayStr
        );
        expect(todayAssignment).toBeDefined();
    });

    it('идемпотентность — повторный вызов в тот же день не создаёт дубли', async () => {
        const cookie = await getAuthCookie();
        await seed7Challenges(cookie);

        await request(app).post('/api/challenges/daily-check').set('Cookie', cookie);
        const res = await request(app).post('/api/challenges/daily-check').set('Cookie', cookie);
        expect(res.status).toBe(200);

        const todayStr = new Date().toISOString().split('T')[0];
        const todayAssignments = (res.body.assignments as { date: string }[]).filter(
            (a) => a.date === todayStr
        );
        expect(todayAssignments).toHaveLength(1);
    });
});

// --------------- POST /swap-today ---------------

describe('POST /api/challenges/swap-today', () => {
    async function setupWithAssignment(cookie: string) {
        await seed7Challenges(cookie);
        const res = await request(app).post('/api/challenges/daily-check').set('Cookie', cookie);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayAssignment = (
            res.body.assignments as { date: string; challengeId: string; status: string }[]
        ).find((a) => a.date === todayStr && a.status === 'active');
        const poolIds: string[] = res.body.weekPool?.challengeIds ?? [];
        return { todayAssignment, poolIds };
    }

    it('успешная замена — challengeId обновлён', async () => {
        const cookie = await getAuthCookie();
        const { todayAssignment, poolIds } = await setupWithAssignment(cookie);
        expect(todayAssignment).toBeDefined();

        const newId = poolIds.find((id) => id !== todayAssignment!.challengeId);
        if (!newId) return; // пул из 1 — нечем менять, пропускаем

        const res = await request(app)
            .post('/api/challenges/swap-today')
            .set('Cookie', cookie)
            .send({ newChallengeId: newId });
        expect(res.status).toBe(200);
        expect(res.body.challengeId).toBe(newId);
    });

    it('400 — нет active assignment на сегодня', async () => {
        const cookie = await getAuthCookie();
        const res = await request(app)
            .post('/api/challenges/swap-today')
            .set('Cookie', cookie)
            .send({ newChallengeId: uuid(1) });
        expect(res.status).toBe(400);
    });

    it('400 — newChallengeId не в пуле', async () => {
        const cookie = await getAuthCookie();
        await setupWithAssignment(cookie);

        const res = await request(app)
            .post('/api/challenges/swap-today')
            .set('Cookie', cookie)
            .send({ newChallengeId: uuid(99) });
        expect(res.status).toBe(400);
    });

    it('400 — newChallengeId уже использован в другой день недели', async () => {
        const cookie = await getAuthCookie();
        const { todayAssignment, poolIds } = await setupWithAssignment(cookie);
        expect(todayAssignment).toBeDefined();

        // Создаём assignment на вчера с одним из poolIds
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const otherIdInPool = poolIds.find((id) => id !== todayAssignment?.challengeId);
        if (!otherIdInPool) return; // нечем тестировать

        db.prepare(
            `INSERT INTO challenge_assignments (id, user_id, challenge_id, date, status, completed_at)
             VALUES (?, (SELECT id FROM users WHERE email = 'challenge@example.com'), ?, ?, 'done', NULL)`
        ).run(uuid(600), otherIdInPool, yesterdayStr);

        const res = await request(app)
            .post('/api/challenges/swap-today')
            .set('Cookie', cookie)
            .send({ newChallengeId: otherIdInPool });
        expect(res.status).toBe(400);
    });
});
