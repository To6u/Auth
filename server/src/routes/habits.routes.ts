import { Router } from 'express';
import { z } from 'zod';
import db from '../db';
import { type AuthRequest, authenticate } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { validateRequest } from '../validation/auth.validation';

const router = Router();

// --- Zod schemas ---

const habitSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(200),
    icon: z.string().max(10),
    color: z.string(),
    overflowColor: z.string(),
    targetPerDay: z.number().int().positive(),
    timeSlots: z.array(z.string()),
    radius: z.number().int().positive(),
    order: z.number().int().min(0),
    createdAt: z.string(),
});

const habitUpdateSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    icon: z.string().max(10).optional(),
    color: z.string().optional(),
    overflowColor: z.string().optional(),
    targetPerDay: z.number().int().positive().optional(),
    timeSlots: z.array(z.string()).optional(),
    radius: z.number().int().positive().optional(),
    order: z.number().int().min(0).optional(),
});

const habitLogIncrementSchema = z.object({
    habitId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const reorderHabitsSchema = z.array(
    z.object({
        id: z.string().uuid(),
        order: z.number().int().min(0),
    })
);

// --- Prepared statements ---

const stmtGetHabits = db.prepare(
    'SELECT id, user_id, name, icon, color, overflow_color, target_per_day, time_slots, radius, "order", created_at FROM habits WHERE user_id = ? ORDER BY "order" ASC'
);

const stmtInsertHabit = db.prepare(`
    INSERT INTO habits (id, user_id, name, icon, color, overflow_color, target_per_day, time_slots, radius, "order", created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const stmtFindHabitById = db.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?');

const stmtUpdateHabit = db.prepare(`
    UPDATE habits SET
        name = COALESCE(?, name),
        icon = COALESCE(?, icon),
        color = COALESCE(?, color),
        overflow_color = COALESCE(?, overflow_color),
        target_per_day = COALESCE(?, target_per_day),
        time_slots = COALESCE(?, time_slots),
        radius = COALESCE(?, radius),
        "order" = COALESCE(?, "order")
    WHERE id = ? AND user_id = ?
`);

const stmtDeleteHabit = db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?');

const stmtUpdateHabitOrder = db.prepare(
    'UPDATE habits SET "order" = ? WHERE id = ? AND user_id = ?'
);

const stmtGetLogs = db.prepare(
    'SELECT habit_id, user_id, date, completions FROM habit_logs WHERE user_id = ?'
);

const stmtIncrementLog = db.prepare(`
    INSERT INTO habit_logs (habit_id, user_id, date, completions) VALUES (?, ?, ?, 1)
    ON CONFLICT(habit_id, user_id, date) DO UPDATE SET completions = completions + 1
`);

const stmtGetLog = db.prepare(
    'SELECT completions FROM habit_logs WHERE habit_id = ? AND user_id = ? AND date = ?'
);

const stmtDecrementLog = db.prepare(`
    UPDATE habit_logs SET completions = completions - 1
    WHERE habit_id = ? AND user_id = ? AND date = ? AND completions > 1
`);

const stmtDeleteLog = db.prepare(
    'DELETE FROM habit_logs WHERE habit_id = ? AND user_id = ? AND date = ?'
);

// --- Row interfaces ---

interface HabitRow {
    id: string;
    user_id: number;
    name: string;
    icon: string;
    color: string;
    overflow_color: string;
    target_per_day: number;
    time_slots: string;
    radius: number;
    order: number;
    created_at: string;
}

interface HabitLogRow {
    habit_id: string;
    user_id: number;
    date: string;
    completions: number;
}

// --- Row mappers ---

function mapHabit(row: HabitRow) {
    return {
        id: row.id,
        name: row.name,
        icon: row.icon,
        color: row.color,
        overflowColor: row.overflow_color,
        targetPerDay: row.target_per_day,
        timeSlots: (() => {
            try {
                return JSON.parse(row.time_slots) as string[];
            } catch {
                return [];
            }
        })(),
        radius: row.radius,
        order: row.order,
        createdAt: row.created_at,
    };
}

function mapLog(row: HabitLogRow) {
    return {
        habitId: row.habit_id,
        date: row.date,
        completions: row.completions,
    };
}

// --- Routes ---

// GET /api/habits/logs — BEFORE /:id
router.get('/logs', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const rows = stmtGetLogs.all(userId) as HabitLogRow[];
    res.json(rows.map(mapLog));
});

// POST /api/habits/logs/increment — BEFORE /:id
router.post(
    '/logs/increment',
    authenticate,
    validateRequest(habitLogIncrementSchema),
    (req: AuthRequest, res) => {
        const userId = req.user!.userId;
        const { habitId, date } = req.body as z.infer<typeof habitLogIncrementSchema>;

        stmtIncrementLog.run(habitId, userId, date);

        const row = stmtGetLog.get(habitId, userId, date) as { completions: number } | undefined;
        const completions = row?.completions ?? 1;

        logger.info(
            `Habit log increment: habitId=${habitId} date=${date} completions=${completions} user=${userId}`
        );
        res.json({ habitId, date, completions });
    }
);

// POST /api/habits/logs/decrement — BEFORE /:id
router.post(
    '/logs/decrement',
    authenticate,
    validateRequest(habitLogIncrementSchema),
    (req: AuthRequest, res) => {
        const userId = req.user!.userId;
        const { habitId, date } = req.body as z.infer<typeof habitLogIncrementSchema>;

        const decrementTransaction = db.transaction(() => {
            const row = stmtGetLog.get(habitId, userId, date) as
                | { completions: number }
                | undefined;
            if (!row || row.completions <= 0) {
                return null;
            }
            if (row.completions === 1) {
                stmtDeleteLog.run(habitId, userId, date);
                return null;
            }
            stmtDecrementLog.run(habitId, userId, date);
            const updated = stmtGetLog.get(habitId, userId, date) as
                | { completions: number }
                | undefined;
            return updated ? { habitId, date, completions: updated.completions } : null;
        });

        const result = decrementTransaction();
        logger.info(`Habit log decrement: habitId=${habitId} date=${date} user=${userId}`);
        res.json(result);
    }
);

// PATCH /api/habits/reorder — BEFORE /:id
router.patch('/reorder', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const parsed = reorderHabitsSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Ошибка валидации', details: parsed.error.issues });
    }

    const reorderTransaction = db.transaction((items: { id: string; order: number }[]) => {
        for (const item of items) {
            stmtUpdateHabitOrder.run(item.order, item.id, userId);
        }
    });

    reorderTransaction(parsed.data);
    logger.info(`Reorder habits: ${parsed.data.length} items for user=${userId}`);
    res.json({ ok: true });
});

// GET /api/habits
router.get('/', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const rows = stmtGetHabits.all(userId) as HabitRow[];
    res.json(rows.map(mapHabit));
});

// POST /api/habits
router.post('/', authenticate, validateRequest(habitSchema), (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const data = req.body as z.infer<typeof habitSchema>;

    const existing = stmtFindHabitById.get(data.id, userId);
    if (existing) {
        return res.status(409).json({ error: 'Привычка с таким id уже существует' });
    }

    stmtInsertHabit.run(
        data.id,
        userId,
        data.name,
        data.icon,
        data.color,
        data.overflowColor,
        data.targetPerDay,
        JSON.stringify(data.timeSlots),
        data.radius,
        data.order,
        data.createdAt
    );
    logger.info(`Привычка создана: ${data.id} user=${userId}`);

    res.status(201).json(
        mapHabit({
            id: data.id,
            user_id: userId,
            name: data.name,
            icon: data.icon,
            color: data.color,
            overflow_color: data.overflowColor,
            target_per_day: data.targetPerDay,
            time_slots: JSON.stringify(data.timeSlots),
            radius: data.radius,
            order: data.order,
            created_at: data.createdAt,
        })
    );
});

// PUT /api/habits/:id
router.put('/:id', authenticate, validateRequest(habitSchema), (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const data = req.body as z.infer<typeof habitSchema>;

    const existing = stmtFindHabitById.get(id, userId);
    if (!existing) {
        return res.status(404).json({ error: 'Привычка не найдена' });
    }

    stmtUpdateHabit.run(
        data.name,
        data.icon,
        data.color,
        data.overflowColor,
        data.targetPerDay,
        JSON.stringify(data.timeSlots),
        data.radius,
        data.order,
        id,
        userId
    );
    logger.info(`Привычка обновлена: ${id} user=${userId}`);

    res.json(
        mapHabit({
            id,
            user_id: userId,
            name: data.name,
            icon: data.icon,
            color: data.color,
            overflow_color: data.overflowColor,
            target_per_day: data.targetPerDay,
            time_slots: JSON.stringify(data.timeSlots),
            radius: data.radius,
            order: data.order,
            created_at: data.createdAt,
        })
    );
});

// DELETE /api/habits/:id
router.delete('/:id', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const result = stmtDeleteHabit.run(id, userId);
    if (result.changes === 0) {
        return res.status(404).json({ error: 'Привычка не найдена' });
    }

    logger.info(`Привычка удалена: ${id} user=${userId}`);
    res.status(204).end();
});

export default router;
