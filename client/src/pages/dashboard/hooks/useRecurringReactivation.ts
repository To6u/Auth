import { useEffect, useRef } from 'react';
import type { Task } from '../types';
import { todayISO } from '../utils/recurrence';

const REACTIVATION_INTERVAL_MS = 5 * 60 * 1000;

export function useRecurringReactivation(
    tasks: Task[],
    loading: boolean,
    updateTask: (id: string, patch: Partial<Task>) => Promise<void>
) {
    const updateRef = useRef(updateTask);
    updateRef.current = updateTask;

    const tasksRef = useRef(tasks);
    tasksRef.current = tasks;

    useEffect(() => {
        if (loading) return;

        const scan = () => {
            const today = todayISO();
            for (const task of tasksRef.current) {
                if (
                    task.recurrence &&
                    task.status === 'done' &&
                    task.dueDate &&
                    task.dueDate <= today
                ) {
                    void updateRef.current(task.id, {
                        status: 'active',
                        completedAt: null,
                    } as Partial<Task>);
                }
            }
        };

        scan();
        const id = setInterval(scan, REACTIVATION_INTERVAL_MS);
        return () => clearInterval(id);
    }, [loading]);
}
