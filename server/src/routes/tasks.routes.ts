import { Router } from 'express';
import { z } from 'zod';
import db from '../db';
import { type AuthRequest, authenticate } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { validateRequest } from '../validation/auth.validation';

const router = Router();

// --- Zod schemas ---

const recurrenceSchema = z.object({
    type: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly', 'custom']),
    interval: z.number().int().positive().optional(),
    unit: z.enum(['day', 'week', 'month']).optional(),
});

const remindersSchema = z.object({
    enabled: z.boolean(),
    times: z.array(z.string().regex(/^\d{2}:\d{2}$/)),
});

const taskSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(500),
    description: z.string().max(2000).optional(),
    sectionId: z.string(),
    tags: z.array(z.string()),
    status: z.enum(['active', 'done', 'archived']),
    pinned: z.boolean(),
    order: z.number().int().min(0),
    dueDate: z.string().optional(),
    notification: z.string().optional(),
    estimatedMinutes: z.number().int().positive().optional(),
    completedAt: z.string().optional(),
    createdAt: z.string(),
    recurrence: recurrenceSchema.optional(),
    reminders: remindersSchema.optional(),
    completionLog: z.array(z.string()).optional(),
    completedCount: z.number().int().min(0).optional(),
});

const taskUpdateSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(2000).optional().nullable(),
    sectionId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['active', 'done', 'archived']).optional(),
    pinned: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
    dueDate: z.string().optional().nullable(),
    notification: z.string().optional().nullable(),
    estimatedMinutes: z.number().int().positive().optional().nullable(),
    completedAt: z.string().optional().nullable(),
    recurrence: recurrenceSchema.optional().nullable(),
    reminders: remindersSchema.optional().nullable(),
    completionLog: z.array(z.string()).optional(),
    completedCount: z.number().int().min(0).optional(),
});

const reorderSchema = z.array(
    z.object({
        id: z.string().uuid(),
        order: z.number().int().min(0),
    })
);

// --- Prepared statements ---

const stmtArchiveStale = db.prepare(`
    UPDATE tasks SET status = 'archived'
    WHERE user_id = ? AND status = 'done' AND completed_at < ?
`);

const SELECT_COLS =
    'id, user_id, title, description, section_id, tags, status, pinned, "order", due_date, notification, estimated_minutes, completed_at, created_at, recurrence, reminders, completion_log, completed_count';

const stmtGetTasks = db.prepare(
    `SELECT ${SELECT_COLS} FROM tasks WHERE user_id = ? ORDER BY "order" ASC`
);

const stmtInsertTask = db.prepare(`
    INSERT INTO tasks (id, user_id, title, description, section_id, tags, status, pinned, "order", due_date, notification, estimated_minutes, completed_at, created_at, recurrence, reminders, completion_log, completed_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const stmtFindTaskById = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?');

const stmtGetTaskById = db.prepare(`SELECT ${SELECT_COLS} FROM tasks WHERE id = ? AND user_id = ?`);

const stmtUpdateTask = db.prepare(`
    UPDATE tasks SET
        title = COALESCE(?, title),
        description = ?,
        section_id = COALESCE(?, section_id),
        tags = COALESCE(?, tags),
        status = COALESCE(?, status),
        pinned = COALESCE(?, pinned),
        "order" = COALESCE(?, "order"),
        due_date = ?,
        notification = ?,
        estimated_minutes = ?,
        completed_at = ?,
        recurrence = ?,
        reminders = ?,
        completion_log = COALESCE(?, completion_log),
        completed_count = COALESCE(?, completed_count)
    WHERE id = ? AND user_id = ?
`);

const stmtDeleteTask = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?');

const stmtUpdateTaskOrder = db.prepare('UPDATE tasks SET "order" = ? WHERE id = ? AND user_id = ?');

// --- Row interfaces ---

interface TaskRow {
    id: string;
    user_id: number;
    title: string;
    description?: string;
    section_id: string;
    tags: string;
    status: string;
    pinned: number;
    order: number;
    due_date?: string;
    notification?: string;
    estimated_minutes?: number;
    completed_at?: string;
    created_at: string;
    recurrence?: string;
    reminders?: string;
    completion_log?: string;
    completed_count?: number;
}

function parseJSON<T>(raw: string | undefined, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

// --- Row mapper ---

function mapTask(row: TaskRow) {
    return {
        id: row.id,
        title: row.title,
        description: row.description ?? undefined,
        sectionId: row.section_id,
        tags: parseJSON<string[]>(row.tags, []),
        status: row.status as 'active' | 'done' | 'archived',
        pinned: Boolean(row.pinned),
        order: row.order,
        dueDate: row.due_date ?? undefined,
        notification: row.notification ?? undefined,
        estimatedMinutes: row.estimated_minutes ?? undefined,
        completedAt: row.completed_at ?? undefined,
        createdAt: row.created_at,
        recurrence: row.recurrence
            ? parseJSON<z.infer<typeof recurrenceSchema> | undefined>(row.recurrence, undefined)
            : undefined,
        reminders: row.reminders
            ? parseJSON<z.infer<typeof remindersSchema> | undefined>(row.reminders, undefined)
            : undefined,
        completionLog: parseJSON<string[]>(row.completion_log, []),
        completedCount: row.completed_count ?? 0,
    };
}

// --- Routes ---

router.get('/', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const rows = stmtGetTasks.all(userId) as TaskRow[];
    res.json(rows.map(mapTask));
});

router.post('/archive-stale', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const result = stmtArchiveStale.run(userId, todayStart.toISOString());
    logger.info(`Archive stale: ${result.changes} tasks archived for user=${userId}`);
    res.json({ archived: result.changes });
});

router.patch('/reorder', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Ошибка валидации', details: parsed.error.issues });
    }

    const reorderTransaction = db.transaction((items: { id: string; order: number }[]) => {
        for (const item of items) {
            stmtUpdateTaskOrder.run(item.order, item.id, userId);
        }
    });

    reorderTransaction(parsed.data);
    logger.info(`Reorder tasks: ${parsed.data.length} items for user=${userId}`);
    res.json({ ok: true });
});

router.post('/', authenticate, validateRequest(taskSchema), (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const data = req.body as z.infer<typeof taskSchema>;

    const existing = stmtFindTaskById.get(data.id, userId);
    if (existing) {
        return res.status(409).json({ error: 'Задача с таким id уже существует' });
    }

    stmtInsertTask.run(
        data.id,
        userId,
        data.title,
        data.description ?? null,
        data.sectionId,
        JSON.stringify(data.tags),
        data.status,
        data.pinned ? 1 : 0,
        data.order,
        data.dueDate ?? null,
        data.notification ?? null,
        data.estimatedMinutes ?? null,
        data.completedAt ?? null,
        data.createdAt,
        data.recurrence ? JSON.stringify(data.recurrence) : null,
        data.reminders ? JSON.stringify(data.reminders) : null,
        JSON.stringify(data.completionLog ?? []),
        data.completedCount ?? 0
    );
    logger.info(`Задача создана: ${data.id} user=${userId}`);

    const created = stmtGetTaskById.get(data.id, userId) as TaskRow;
    res.status(201).json(mapTask(created));
});

router.put('/:id', authenticate, validateRequest(taskSchema), (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const data = req.body as z.infer<typeof taskSchema>;

    const existing = stmtFindTaskById.get(id, userId);
    if (!existing) {
        return res.status(404).json({ error: 'Задача не найдена' });
    }

    stmtUpdateTask.run(
        data.title,
        data.description ?? null,
        data.sectionId,
        JSON.stringify(data.tags),
        data.status,
        data.pinned ? 1 : 0,
        data.order,
        data.dueDate ?? null,
        data.notification ?? null,
        data.estimatedMinutes ?? null,
        data.completedAt ?? null,
        data.recurrence ? JSON.stringify(data.recurrence) : null,
        data.reminders ? JSON.stringify(data.reminders) : null,
        JSON.stringify(data.completionLog ?? []),
        data.completedCount ?? 0,
        id,
        userId
    );
    logger.info(`Задача обновлена: ${id} user=${userId}`);

    const updated = stmtGetTaskById.get(id, userId) as TaskRow;
    res.json(mapTask(updated));
});

router.patch('/:id', authenticate, validateRequest(taskUpdateSchema), (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const patch = req.body as z.infer<typeof taskUpdateSchema>;

    const current = stmtGetTaskById.get(id, userId) as TaskRow | undefined;
    if (!current) {
        return res.status(404).json({ error: 'Задача не найдена' });
    }

    stmtUpdateTask.run(
        patch.title ?? null,
        patch.description !== undefined
            ? (patch.description ?? null)
            : (current.description ?? null),
        patch.sectionId ?? null,
        patch.tags !== undefined ? JSON.stringify(patch.tags) : null,
        patch.status ?? null,
        patch.pinned !== undefined ? (patch.pinned ? 1 : 0) : null,
        patch.order ?? null,
        patch.dueDate !== undefined ? (patch.dueDate ?? null) : (current.due_date ?? null),
        patch.notification !== undefined
            ? (patch.notification ?? null)
            : (current.notification ?? null),
        patch.estimatedMinutes !== undefined
            ? (patch.estimatedMinutes ?? null)
            : (current.estimated_minutes ?? null),
        patch.completedAt !== undefined
            ? (patch.completedAt ?? null)
            : (current.completed_at ?? null),
        patch.recurrence !== undefined
            ? patch.recurrence === null
                ? null
                : JSON.stringify(patch.recurrence)
            : (current.recurrence ?? null),
        patch.reminders !== undefined
            ? patch.reminders === null
                ? null
                : JSON.stringify(patch.reminders)
            : (current.reminders ?? null),
        patch.completionLog !== undefined ? JSON.stringify(patch.completionLog) : null,
        patch.completedCount ?? null,
        id,
        userId
    );
    logger.info(`Задача частично обновлена: ${id} user=${userId}`);

    const updated = stmtGetTaskById.get(id, userId) as TaskRow | undefined;
    res.json(updated ? mapTask(updated) : { id });
});

router.delete('/:id', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const result = stmtDeleteTask.run(id, userId);
    if (result.changes === 0) {
        return res.status(404).json({ error: 'Задача не найдена' });
    }

    logger.info(`Задача удалена: ${id} user=${userId}`);
    res.status(204).end();
});

export default router;
