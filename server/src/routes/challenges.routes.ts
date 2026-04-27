import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import db from '../db';
import { type AuthRequest, authenticate } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { validateRequest } from '../validation/auth.validation';

const router = Router();

// --- Zod schemas ---

const challengeSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    createdAt: z.string().datetime(),
});

const challengeUpdateSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
});

const assignmentSchema = z.object({
    id: z.string().uuid(),
    challengeId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(['active', 'done', 'failed']),
    completedAt: z.string().datetime().optional(),
});

const assignmentUpdateSchema = z.object({
    status: z.enum(['active', 'done', 'failed']),
    completedAt: z.string().datetime().optional(),
});

const weekPoolSchema = z.object({
    weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    challengeIds: z.array(z.string().uuid()).max(7),
    confirmedAt: z.string().datetime().optional(),
});

const swapTodaySchema = z.object({
    newChallengeId: z.string().uuid(),
});

// --- Prepared statements ---

const stmtGetChallenges = db.prepare(
    'SELECT id, user_id, title, description, created_at FROM challenges WHERE user_id = ?'
);
const stmtInsertChallenge = db.prepare(
    'INSERT INTO challenges (id, user_id, title, description, created_at) VALUES (?, ?, ?, ?, ?)'
);
const stmtFindChallengeById = db.prepare('SELECT id FROM challenges WHERE id = ? AND user_id = ?');
const stmtGetChallengeByIdFull = db.prepare(
    'SELECT id, user_id, title, description, created_at FROM challenges WHERE id = ? AND user_id = ?'
);
const stmtUpdateChallenge = db.prepare(
    'UPDATE challenges SET title = COALESCE(?, title), description = COALESCE(?, description) WHERE id = ? AND user_id = ?'
);
const stmtDeleteChallenge = db.prepare('DELETE FROM challenges WHERE id = ? AND user_id = ?');

const stmtGetAssignments = db.prepare(
    'SELECT id, user_id, challenge_id, date, status, completed_at FROM challenge_assignments WHERE user_id = ?'
);
const stmtInsertAssignment = db.prepare(
    'INSERT INTO challenge_assignments (id, user_id, challenge_id, date, status, completed_at) VALUES (?, ?, ?, ?, ?, ?)'
);
const stmtFindAssignmentById = db.prepare(
    'SELECT id FROM challenge_assignments WHERE id = ? AND user_id = ?'
);
const stmtUpdateAssignment = db.prepare(
    'UPDATE challenge_assignments SET status = ?, completed_at = ? WHERE id = ? AND user_id = ?'
);

const stmtGetWeekPools = db.prepare(
    'SELECT user_id, week_start, challenge_ids, confirmed_at FROM challenge_week_pools WHERE user_id = ?'
);
const stmtUpsertWeekPool = db.prepare(`
    INSERT INTO challenge_week_pools (user_id, week_start, challenge_ids, confirmed_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, week_start) DO UPDATE SET
        challenge_ids = excluded.challenge_ids,
        confirmed_at = excluded.confirmed_at
`);

// daily-check statements
const stmtFailStaleAssignments = db.prepare(
    `UPDATE challenge_assignments SET status = 'failed'
     WHERE user_id = ? AND status = 'active' AND date < ?`
);
const stmtGetTodayAssignment = db.prepare(
    `SELECT id, challenge_id, status FROM challenge_assignments WHERE user_id = ? AND date = ?`
);
const stmtDeleteAssignment = db.prepare(
    `DELETE FROM challenge_assignments WHERE id = ? AND user_id = ?`
);
const stmtGetCurrentWeekPool = db.prepare(
    `SELECT challenge_ids, confirmed_at FROM challenge_week_pools
     WHERE user_id = ? AND week_start = ?`
);
const stmtGetWeekAssignments = db.prepare(
    `SELECT challenge_id, date, status FROM challenge_assignments
     WHERE user_id = ? AND date >= ? AND date <= ?`
);
const stmtGetAllChallengeIds = db.prepare(`SELECT id FROM challenges WHERE user_id = ?`);
const stmtCreatePoolIfAbsent = db.prepare(`
    INSERT INTO challenge_week_pools (user_id, week_start, challenge_ids, confirmed_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, week_start) DO UPDATE SET
        confirmed_at = COALESCE(challenge_week_pools.confirmed_at, excluded.confirmed_at)
`);

// swap-today statements
const stmtFindTodayActiveAssignment = db.prepare(
    `SELECT id, challenge_id FROM challenge_assignments
     WHERE user_id = ? AND date = ? AND status = 'active'`
);
const stmtSwapAssignmentChallenge = db.prepare(
    `UPDATE challenge_assignments SET challenge_id = ? WHERE id = ? AND user_id = ?`
);

// --- Row interfaces ---

interface ChallengeRow {
    id: string;
    user_id: number;
    title: string;
    description?: string;
    created_at: string;
}

interface AssignmentRow {
    id: string;
    user_id: number;
    challenge_id: string;
    date: string;
    status: 'active' | 'done' | 'failed';
    completed_at?: string;
}

interface WeekPoolRow {
    user_id: number;
    week_start: string;
    challenge_ids: string;
    confirmed_at?: string;
}

interface WeekPoolPoolRow {
    challenge_ids: string;
    confirmed_at?: string;
}

interface WeekAssignmentRow {
    challenge_id: string;
    date: string;
    status: 'active' | 'done' | 'failed';
}

interface TodayActiveRow {
    id: string;
    challenge_id: string;
}

interface ChallengeIdRow {
    id: string;
}

interface TodayAssignmentIdRow {
    id: string;
    challenge_id: string;
    status: string;
}

// --- Row mappers ---

function mapChallenge(row: ChallengeRow) {
    return {
        id: row.id,
        title: row.title,
        description: row.description ?? undefined,
        createdAt: row.created_at,
    };
}

function mapAssignment(row: AssignmentRow) {
    return {
        id: row.id,
        challengeId: row.challenge_id,
        date: row.date,
        status: row.status,
        completedAt: row.completed_at ?? undefined,
    };
}

function mapWeekPool(row: WeekPoolRow) {
    return {
        weekStart: row.week_start,
        challengeIds: (() => {
            try {
                return JSON.parse(row.challenge_ids) as string[];
            } catch {
                return [];
            }
        })(),
        confirmedAt: row.confirmed_at ?? undefined,
    };
}

function getWeekStart(date: Date): string {
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    return monday.toISOString().split('T')[0];
}

// --- Routes (specific paths BEFORE /:id) ---

// POST /api/challenges/daily-check
router.post('/daily-check', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const today = new Date().toISOString().split('T')[0];
    const weekStart = getWeekStart(new Date());
    const weekEndDate = new Date(weekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = weekEndDate.toISOString().split('T')[0];
    const now = new Date().toISOString();

    const dailyCheckTransaction = db.transaction(() => {
        // 1. Fail stale active assignments
        stmtFailStaleAssignments.run(userId, today);

        // 2. Get all challenge ids
        const challengeIdRows = stmtGetAllChallengeIds.all(userId) as ChallengeIdRow[];
        if (challengeIdRows.length === 0) {
            return { assignments: [], weekPool: null };
        }

        const allIds = challengeIdRows.map((r) => r.id);

        // 3. Get or create pool
        const poolRow = stmtGetCurrentWeekPool.get(userId, weekStart) as
            | WeekPoolPoolRow
            | undefined;

        let poolIds: string[];

        if (!poolRow) {
            // Create new pool
            const shuffled = [...allIds].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, Math.min(7, shuffled.length));
            stmtCreatePoolIfAbsent.run(userId, weekStart, JSON.stringify(selected), now);
            poolIds = selected;
        } else {
            // Pool exists — auto-confirm if not confirmed yet
            if (!poolRow.confirmed_at) {
                stmtCreatePoolIfAbsent.run(userId, weekStart, poolRow.challenge_ids, now);
            }
            try {
                poolIds = JSON.parse(poolRow.challenge_ids) as string[];
            } catch {
                poolIds = [];
            }
        }

        // 4. Get used challenge ids this week (excluding today)
        const weekRows = stmtGetWeekAssignments.all(
            userId,
            weekStart,
            weekEnd
        ) as WeekAssignmentRow[];
        const usedIds = weekRows.filter((r) => r.date !== today).map((r) => r.challenge_id);

        // 5. Check if today already has an assignment
        const todayRow = stmtGetTodayAssignment.get(userId, today) as
            | TodayAssignmentIdRow
            | undefined;

        // Если активное задание ссылается на удалённый челлендж — удаляем и создаём новое
        const orphaned = todayRow?.status === 'active' && !allIds.includes(todayRow.challenge_id);
        if (orphaned && todayRow) {
            stmtDeleteAssignment.run(todayRow.id, userId);
        }

        if (!todayRow || orphaned) {
            // Только существующие в БД + не использованные на этой неделе
            const available = poolIds.filter((id) => allIds.includes(id) && !usedIds.includes(id));
            if (available.length > 0) {
                const chosenId = available[Math.floor(Math.random() * available.length)];
                const assignmentId = randomUUID();
                stmtInsertAssignment.run(assignmentId, userId, chosenId, today, 'active', null);
            }
        }

        // 6. Return fresh data
        const assignments = stmtGetAssignments.all(userId) as AssignmentRow[];
        const updatedPoolRow = stmtGetCurrentWeekPool.get(userId, weekStart) as
            | WeekPoolPoolRow
            | undefined;

        const weekPool = updatedPoolRow
            ? {
                  weekStart,
                  challengeIds: JSON.parse(updatedPoolRow.challenge_ids) as string[],
                  confirmedAt: updatedPoolRow.confirmed_at ?? undefined,
              }
            : null;

        return {
            assignments: assignments.map(mapAssignment),
            weekPool,
        };
    });

    const result = dailyCheckTransaction() as {
        assignments: ReturnType<typeof mapAssignment>[];
        weekPool: { weekStart: string; challengeIds: string[]; confirmedAt?: string } | null;
    };

    logger.info(`daily-check: user=${userId} today=${today}`);
    res.json(result);
});

// POST /api/challenges/swap-today
router.post(
    '/swap-today',
    authenticate,
    validateRequest(swapTodaySchema),
    (req: AuthRequest, res) => {
        const userId = req.user!.userId;
        const { newChallengeId } = req.body as z.infer<typeof swapTodaySchema>;
        const today = new Date().toISOString().split('T')[0];
        const weekStart = getWeekStart(new Date());
        const weekEndDate = new Date(weekStart);
        weekEndDate.setDate(weekEndDate.getDate() + 6);
        const weekEnd = weekEndDate.toISOString().split('T')[0];

        // 1. Find today's active assignment
        const assignmentRow = stmtFindTodayActiveAssignment.get(userId, today) as
            | TodayActiveRow
            | undefined;
        if (!assignmentRow) {
            return res.status(400).json({ error: 'Нет активного задания на сегодня' });
        }

        // 2. Get pool
        const poolRow = stmtGetCurrentWeekPool.get(userId, weekStart) as
            | WeekPoolPoolRow
            | undefined;
        if (!poolRow) {
            return res.status(400).json({ error: 'Пул на эту неделю не найден' });
        }

        // 3. Check newChallengeId is in pool
        let poolIds: string[];
        try {
            poolIds = JSON.parse(poolRow.challenge_ids) as string[];
        } catch {
            return res.status(500).json({ error: 'Повреждённые данные пула' });
        }
        if (!poolIds.includes(newChallengeId)) {
            return res.status(400).json({ error: 'Челлендж не входит в пул этой недели' });
        }

        // 4. Check newChallengeId not successfully done on another day this week
        // failed-челленджи можно переназначить для повтора
        const weekRows = stmtGetWeekAssignments.all(
            userId,
            weekStart,
            weekEnd
        ) as WeekAssignmentRow[];
        const doneOnOtherDay = weekRows.some(
            (r) => r.challenge_id === newChallengeId && r.date !== today && r.status === 'done'
        );
        if (doneOnOtherDay) {
            return res.status(400).json({ error: 'Челлендж уже выполнен в эту неделю' });
        }

        // 5. Swap
        stmtSwapAssignmentChallenge.run(newChallengeId, assignmentRow.id, userId);
        logger.info(
            `swap-today: user=${userId} assignment=${assignmentRow.id} new=${newChallengeId}`
        );

        res.json({
            id: assignmentRow.id,
            challengeId: newChallengeId,
            date: today,
            status: 'active',
        });
    }
);

// GET /api/challenges/assignments
router.get('/assignments', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const rows = stmtGetAssignments.all(userId) as AssignmentRow[];
    res.json(rows.map(mapAssignment));
});

// POST /api/challenges/assignments
router.post(
    '/assignments',
    authenticate,
    validateRequest(assignmentSchema),
    (req: AuthRequest, res) => {
        const userId = req.user!.userId;
        const { id, challengeId, date, status, completedAt } = req.body as z.infer<
            typeof assignmentSchema
        >;

        stmtInsertAssignment.run(id, userId, challengeId, date, status, completedAt ?? null);
        logger.info(`Assignment создан: ${id} user=${userId}`);

        res.status(201).json({ id, challengeId, date, status, completedAt });
    }
);

// PUT /api/challenges/assignments/:id
router.put(
    '/assignments/:id',
    authenticate,
    validateRequest(assignmentUpdateSchema),
    (req: AuthRequest, res) => {
        const userId = req.user!.userId;
        const { id } = req.params;
        const { status, completedAt } = req.body as z.infer<typeof assignmentUpdateSchema>;

        const existing = stmtFindAssignmentById.get(id, userId);
        if (!existing) {
            return res.status(404).json({ error: 'Assignment не найден' });
        }

        stmtUpdateAssignment.run(status, completedAt ?? null, id, userId);
        logger.info(`Assignment обновлён: ${id} status=${status} user=${userId}`);

        res.json({ id, status, completedAt });
    }
);

// GET /api/challenges/week-pools
router.get('/week-pools', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const rows = stmtGetWeekPools.all(userId) as WeekPoolRow[];
    res.json(rows.map(mapWeekPool));
});

// PUT /api/challenges/week-pools/:weekStart
router.put(
    '/week-pools/:weekStart',
    authenticate,
    validateRequest(weekPoolSchema),
    (req: AuthRequest, res) => {
        const userId = req.user!.userId;
        const { weekStart } = req.params;
        const { challengeIds, confirmedAt } = req.body as z.infer<typeof weekPoolSchema>;

        stmtUpsertWeekPool.run(
            userId,
            weekStart,
            JSON.stringify(challengeIds),
            confirmedAt ?? null
        );
        logger.info(`WeekPool upsert: weekStart=${weekStart} user=${userId}`);

        res.json({ weekStart, challengeIds, confirmedAt });
    }
);

// GET /api/challenges
router.get('/', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const rows = stmtGetChallenges.all(userId) as ChallengeRow[];
    res.json(rows.map(mapChallenge));
});

// POST /api/challenges
router.post('/', authenticate, validateRequest(challengeSchema), (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { id, title, description, createdAt } = req.body as z.infer<typeof challengeSchema>;

    const existing = stmtFindChallengeById.get(id, userId);
    if (existing) {
        return res.status(409).json({ error: 'Челлендж с таким id уже существует' });
    }

    stmtInsertChallenge.run(id, userId, title, description ?? null, createdAt);
    logger.info(`Челлендж создан: ${id} user=${userId}`);

    res.status(201).json({ id, title, description, createdAt });
});

// PUT /api/challenges/:id
router.put(
    '/:id',
    authenticate,
    validateRequest(challengeUpdateSchema),
    (req: AuthRequest, res) => {
        const userId = req.user!.userId;
        const { id } = req.params;
        const { title, description } = req.body as z.infer<typeof challengeUpdateSchema>;

        const existing = stmtFindChallengeById.get(id, userId);
        if (!existing) {
            return res.status(404).json({ error: 'Челлендж не найден' });
        }

        stmtUpdateChallenge.run(title ?? null, description ?? null, id, userId);
        logger.info(`Челлендж обновлён: ${id} user=${userId}`);

        const row = stmtGetChallengeByIdFull.get(id, userId) as ChallengeRow | undefined;
        res.json(row ? mapChallenge(row) : { id });
    }
);

// DELETE /api/challenges/:id
router.delete('/:id', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const result = stmtDeleteChallenge.run(id, userId);
    if (result.changes === 0) {
        return res.status(404).json({ error: 'Челлендж не найден' });
    }

    logger.info(`Челлендж удалён: ${id} user=${userId}`);
    res.status(204).end();
});

export default router;
