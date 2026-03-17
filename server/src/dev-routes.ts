import type { Express } from 'express';
import db from './db';

/**
 * Development-only routes
 * These routes should NEVER be available in production
 */
export const registerDevRoutes = (app: Express) => {
    // Get all users (without passwords)
    app.get('/api/dev/users', (req, res) => {
        try {
            const stmt = db.prepare('SELECT id, email, created_at FROM users');
            const users = stmt.all();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    // Get user count
    app.get('/api/dev/users/count', (req, res) => {
        try {
            const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
            const result = stmt.get() as { count: number };
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    // Delete user by email (for testing)
    app.delete('/api/dev/users/:email', (req, res) => {
        try {
            const { email } = req.params;
            const stmt = db.prepare('DELETE FROM users WHERE email = ?');
            const result = stmt.run(email);
            res.json({
                message: 'User deleted',
                changes: result.changes,
            });
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    // Clear all users (DANGER!)
    app.delete('/api/dev/users', (req, res) => {
        try {
            const stmt = db.prepare('DELETE FROM users');
            const result = stmt.run();
            res.json({
                message: 'All users deleted',
                changes: result.changes,
            });
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    console.log('🔧 Dev routes registered:');
    console.log('  GET    /api/dev/users');
    console.log('  GET    /api/dev/users/count');
    console.log('  DELETE /api/dev/users/:email');
    console.log('  DELETE /api/dev/users');
};
