import { Router } from 'express';
import { z } from 'zod';
import db from '../db';
import { type AuthRequest, authenticate } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { validateRequest } from '../validation/auth.validation';

const router = Router();

// --- Zod schemas ---

const sectionSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(200),
    order: z.number().int().min(0),
});

const sectionUpdateSchema = z.object({
    name: z.string().min(1).max(200),
});

// --- Prepared statements ---

const stmtGetSections = db.prepare(
    'SELECT id, user_id, name, "order" FROM sections WHERE user_id = ? ORDER BY "order" ASC'
);

const stmtInsertSection = db.prepare(
    'INSERT INTO sections (id, user_id, name, "order") VALUES (?, ?, ?, ?)'
);

const stmtFindSectionById = db.prepare('SELECT id FROM sections WHERE id = ? AND user_id = ?');

const stmtUpdateSection = db.prepare('UPDATE sections SET name = ? WHERE id = ? AND user_id = ?');

const stmtDeleteSection = db.prepare('DELETE FROM sections WHERE id = ? AND user_id = ?');

const stmtReassignTasks = db.prepare(
    "UPDATE tasks SET section_id = 'all' WHERE section_id = ? AND user_id = ?"
);

// --- Row interfaces ---

interface SectionRow {
    id: string;
    user_id: number;
    name: string;
    order: number;
}

// --- Row mapper ---

function mapSection(row: SectionRow) {
    return {
        id: row.id,
        name: row.name,
        order: row.order,
        isSystem: false,
    };
}

// --- Routes ---

// GET /api/sections
router.get('/', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const rows = stmtGetSections.all(userId) as SectionRow[];
    res.json(rows.map(mapSection));
});

// POST /api/sections
router.post('/', authenticate, validateRequest(sectionSchema), (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { id, name, order } = req.body as z.infer<typeof sectionSchema>;

    stmtInsertSection.run(id, userId, name, order);
    logger.info(`Секция создана: ${id} user=${userId}`);

    res.status(201).json({ id, name, order, isSystem: false });
});

// PUT /api/sections/:id
router.put('/:id', authenticate, validateRequest(sectionUpdateSchema), (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { name } = req.body as z.infer<typeof sectionUpdateSchema>;

    const existing = stmtFindSectionById.get(id, userId);
    if (!existing) {
        return res.status(404).json({ error: 'Секция не найдена' });
    }

    stmtUpdateSection.run(name, id, userId);
    logger.info(`Секция обновлена: ${id} user=${userId}`);

    res.json({ id, name, isSystem: false });
});

// DELETE /api/sections/:id — transaction: reassign tasks + delete section
router.delete('/:id', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const existing = stmtFindSectionById.get(id, userId);
    if (!existing) {
        return res.status(404).json({ error: 'Секция не найдена' });
    }

    const deleteSectionTransaction = db.transaction(() => {
        stmtReassignTasks.run(id, userId);
        stmtDeleteSection.run(id, userId);
    });

    deleteSectionTransaction();
    logger.info(`Секция удалена: ${id} user=${userId}, задачи перенесены в 'all'`);

    res.status(204).end();
});

export default router;
