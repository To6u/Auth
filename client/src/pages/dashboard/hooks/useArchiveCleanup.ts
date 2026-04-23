import { useEffect, useRef } from 'react';
import type { Task } from '../types';

export function useArchiveCleanup(
    tasks: Task[],
    loading: boolean,
    updateTask: (id: string, patch: Partial<Task>) => Promise<void>
) {
    const cleanedRef = useRef(false);
    const updateRef = useRef(updateTask);
    updateRef.current = updateTask;

    useEffect(() => {
        if (loading || cleanedRef.current || tasks.length === 0) return;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startOfTodayISO = startOfToday.toISOString();

        const toArchive = tasks.filter(
            (t) =>
                t.status === 'done' &&
                !t.recurrence &&
                t.completedAt &&
                t.completedAt < startOfTodayISO
        );

        cleanedRef.current = true;

        for (const task of toArchive) {
            void updateRef.current(task.id, { status: 'archived' });
        }
    }, [loading, tasks]);
}
