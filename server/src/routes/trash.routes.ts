import { Router } from 'express';
import { z } from 'zod';
import db from '../db';
import { type AuthRequest, authenticate } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { validateRequest } from '../validation/auth.validation';

const router = Router();

// --- Zod schemas ---

const trashItemSchema = z.object({
    id: z.string().uuid(),
    type: z.enum(['task', 'habit', 'challenge']),
    data: z.record(z.string(), z.unknown()),
    deletedAt: z.string(),
    expiresAt: z.string(),
});

// --- Prepared statements ---

const stmtCleanupExpired = db.prepare(
    'DELETE FROM trash_items WHERE user_id = ? AND expires_at < ?'
);

const stmtGetTrash = db.prepare(
    'SELECT id, user_id, type, data, deleted_at, expires_at FROM trash_items WHERE user_id = ? ORDER BY deleted_at DESC'
);

const stmtInsertTrash = db.prepare(
    'INSERT INTO trash_items (id, user_id, type, data, deleted_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
);

const stmtFindTrashById = db.prepare(
    'SELECT id, user_id, type, data FROM trash_items WHERE id = ? AND user_id = ?'
);

const stmtDeleteTrash = db.prepare('DELETE FROM trash_items WHERE id = ? AND user_id = ?');

// Restore prepared statements
const stmtFindTaskForRestore = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?');
const stmtInsertTask = db.prepare(`
    INSERT INTO tasks (id, user_id, title, description, section_id, tags, status, pinned, "order", due_date, notification, estimated_minutes, completed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const stmtFindHabitForRestore = db.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?');
const stmtInsertHabit = db.prepare(`
    INSERT INTO habits (id, user_id, name, icon, color, overflow_color, target_per_day, time_slots, radius, "order", created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const stmtFindChallengeForRestore = db.prepare(
    'SELECT id FROM challenges WHERE id = ? AND user_id = ?'
);
const stmtInsertChallenge = db.prepare(
    'INSERT INTO challenges (id, user_id, title, description, created_at) VALUES (?, ?, ?, ?, ?)'
);

// --- Row interfaces ---

interface TrashItemRow {
    id: string;
    user_id: number;
    type: string;
    data: string;
    deleted_at: string;
    expires_at: string;
}

// --- Row mapper ---

function mapTrashItem(row: TrashItemRow) {
    return {
        id: row.id,
        type: row.type as 'task' | 'habit' | 'challenge',
        data: JSON.parse(row.data) as Record<string, unknown>,
        deletedAt: row.deleted_at,
        expiresAt: row.expires_at,
    };
}

// --- Routes ---

// GET /api/trash — cleanup expired first, then return
router.get('/', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const now = new Date().toISOString();
    stmtCleanupExpired.run(userId, now);
    const rows = stmtGetTrash.all(userId) as TrashItemRow[];
    res.json(rows.map(mapTrashItem));
});

// POST /api/trash
router.post('/', authenticate, validateRequest(trashItemSchema), (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { id, type, data, deletedAt, expiresAt } = req.body as z.infer<typeof trashItemSchema>;

    stmtInsertTrash.run(id, userId, type, JSON.stringify(data), deletedAt, expiresAt);
    logger.info(`Trash item добавлен: ${id} type=${type} user=${userId}`);

    res.status(201).json({ id, type, data, deletedAt, expiresAt });
});

// POST /api/trash/:id/restore — BEFORE /:id DELETE to avoid ambiguity, but Express routes by method so fine
router.post('/:id/restore', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const trashRow = stmtFindTrashById.get(id, userId) as
        | { id: string; user_id: number; type: string; data: string }
        | undefined;

    if (!trashRow) {
        return res.status(404).json({ error: 'Элемент корзины не найден' });
    }

    const itemData = JSON.parse(trashRow.data) as Record<string, unknown>;
    const type = trashRow.type as 'task' | 'habit' | 'challenge';

    const restoreTransaction = db.transaction(() => {
        if (type === 'task') {
            const existing = stmtFindTaskForRestore.get(itemData.id as string, userId);
            if (existing) {
                return { conflict: true };
            }
            stmtInsertTask.run(
                itemData.id as string,
                userId,
                itemData.title as string,
                (itemData.description as string | undefined) ?? null,
                (itemData.sectionId as string | undefined) ?? 'all',
                JSON.stringify((itemData.tags as string[] | undefined) ?? []),
                'active',
                (itemData.pinned as boolean | undefined) ? 1 : 0,
                (itemData.order as number | undefined) ?? 0,
                (itemData.dueDate as string | undefined) ?? null,
                (itemData.notification as string | undefined) ?? null,
                (itemData.estimatedMinutes as number | undefined) ?? null,
                null, // completedAt cleared on restore
                itemData.createdAt as string
            );
        } else if (type === 'habit') {
            const existing = stmtFindHabitForRestore.get(itemData.id as string, userId);
            if (existing) {
                return { conflict: true };
            }
            stmtInsertHabit.run(
                itemData.id as string,
                userId,
                itemData.name as string,
                itemData.icon as string,
                itemData.color as string,
                itemData.overflowColor as string,
                (itemData.targetPerDay as number | undefined) ?? 1,
                JSON.stringify((itemData.timeSlots as string[] | undefined) ?? []),
                (itemData.radius as number | undefined) ?? 60,
                (itemData.order as number | undefined) ?? 0,
                itemData.createdAt as string
            );
        } else if (type === 'challenge') {
            const existing = stmtFindChallengeForRestore.get(itemData.id as string, userId);
            if (existing) {
                return { conflict: true };
            }
            stmtInsertChallenge.run(
                itemData.id as string,
                userId,
                itemData.title as string,
                (itemData.description as string | undefined) ?? null,
                itemData.createdAt as string
            );
        }

        stmtDeleteTrash.run(id, userId);
        return { conflict: false };
    });

    const result = restoreTransaction();
    if (result?.conflict) {
        return res.status(409).json({ error: 'Элемент с таким id уже существует' });
    }

    logger.info(`Trash item восстановлен: ${id} type=${type} user=${userId}`);
    res.json({ ok: true });
});

// DELETE /api/trash/:id — permanent delete
router.delete('/:id', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const result = stmtDeleteTrash.run(id, userId);
    if (result.changes === 0) {
        return res.status(404).json({ error: 'Элемент корзины не найден' });
    }

    logger.info(`Trash item удалён навсегда: ${id} user=${userId}`);
    res.status(204).end();
});

export default router;
