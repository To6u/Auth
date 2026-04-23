import { useEffect } from 'react';
import type { Task } from '../types';
import { todayISO } from '../utils/recurrence';

function parseTime(time: string): { h: number; m: number } | null {
    const m = time.match(/^(\d{2}):(\d{2})$/);
    if (!m) return null;
    return { h: Number(m[1]), m: Number(m[2]) };
}

function shouldRemindFor(task: Task): boolean {
    if (!task.reminders?.enabled) return false;
    if (task.reminders.times.length === 0) return false;
    if (task.status === 'archived') return false;
    if (task.status === 'done') return false;
    if (task.dueDate && !task.recurrence && task.dueDate < todayISO()) return false;
    return true;
}

export function useReminders(tasks: Task[]): void {
    useEffect(() => {
        if (typeof Notification === 'undefined') return;

        if (Notification.permission === 'default') {
            void Notification.requestPermission();
        }

        const timers: ReturnType<typeof setTimeout>[] = [];

        for (const task of tasks) {
            if (!shouldRemindFor(task)) continue;

            for (const time of task.reminders!.times) {
                const parsed = parseTime(time);
                if (!parsed) continue;
                const target = new Date();
                target.setHours(parsed.h, parsed.m, 0, 0);
                if (target.getTime() <= Date.now()) {
                    target.setDate(target.getDate() + 1);
                }
                const delay = target.getTime() - Date.now();

                const id = setTimeout(() => {
                    if (Notification.permission !== 'granted') return;
                    try {
                        new Notification(`Задача: ${task.title}`, {
                            body: task.description || `Напоминание · ${time}`,
                            tag: `task-${task.id}-${time}`,
                        });
                    } catch {
                        // ignore — some browsers throw in non-secure contexts
                    }
                }, delay);
                timers.push(id);
            }
        }

        return () => {
            for (const id of timers) clearTimeout(id);
        };
    }, [tasks]);
}
