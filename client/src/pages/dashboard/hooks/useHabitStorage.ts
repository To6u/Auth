import { useCallback, useEffect, useRef, useState } from 'react';
import type { Habit, HabitLog } from '../types';

const DEFAULT_HABITS: Omit<Habit, 'id' | 'createdAt' | 'order'>[] = [
    {
        name: 'Тренировка',
        icon: '🏋️',
        color: '#4CAF50',
        overflowColor: '#81C784',
        targetPerDay: 1,
        timeSlots: [],
        radius: 80,
    },
    {
        name: 'Свой проект',
        icon: '💻',
        color: '#2196F3',
        overflowColor: '#64B5F6',
        targetPerDay: 1,
        timeSlots: [],
        radius: 65,
    },
    {
        name: 'Экспандер',
        icon: '✊',
        color: '#FF9800',
        overflowColor: '#FFB74D',
        targetPerDay: 3,
        timeSlots: [],
        radius: 50,
    },
];

export function useHabitStorage() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [logs, setLogs] = useState<HabitLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Рефы для синхронного доступа к текущему значению в колбэках без добавления в deps
    const habitsRef = useRef(habits);
    habitsRef.current = habits;
    const logsRef = useRef(logs);
    logsRef.current = logs;

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const [habitsRes, logsRes] = await Promise.all([
                    fetch('/api/habits', { credentials: 'include' }),
                    fetch('/api/habits/logs', { credentials: 'include' }),
                ]);

                if (!habitsRes.ok || !logsRes.ok) {
                    throw new Error('Ошибка загрузки привычек');
                }

                const [habitsData, logsData] = await Promise.all([
                    habitsRes.json() as Promise<Habit[]>,
                    logsRes.json() as Promise<HabitLog[]>,
                ]);

                if (!cancelled) {
                    if (habitsData.length === 0) {
                        const defaults = DEFAULT_HABITS.map((h, i) => ({
                            ...h,
                            id: crypto.randomUUID(),
                            createdAt: new Date().toISOString(),
                            order: i,
                        }));
                        setHabits(defaults);
                        void Promise.all(
                            defaults.map((h) =>
                                fetch('/api/habits', {
                                    method: 'POST',
                                    credentials: 'include',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(h),
                                })
                            )
                        );
                    } else {
                        setHabits(habitsData);
                    }
                    setLogs(logsData);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Ошибка загрузки');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    const addHabit = useCallback(
        async (data: Omit<Habit, 'id' | 'createdAt' | 'order'>) => {
            const cur = habitsRef.current;
            const maxOrder = cur.length > 0 ? Math.max(...cur.map((h) => h.order)) : -1;
            const newHabit: Habit = {
                ...data,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                order: maxOrder + 1,
            };
            const prev = cur;
            setHabits((h) => [...h, newHabit]);

            try {
                const res = await fetch('/api/habits', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newHabit),
                });
                if (!res.ok) throw new Error('Ошибка создания привычки');
                const created = (await res.json()) as Habit;
                setHabits((h) => h.map((x) => (x.id === newHabit.id ? created : x)));
            } catch {
                setHabits(prev);
            }
        },
        [] // habitsRef.current читается синхронно в момент вызова — без [habits] в deps
    );

    const updateHabit = useCallback(async (id: string, patch: Partial<Habit>) => {
        const prev = habitsRef.current;
        setHabits((h) => h.map((x) => (x.id === id ? { ...x, ...patch } : x)));

        const habit = prev.find((h) => h.id === id);
        if (!habit) return;
        const updated = { ...habit, ...patch };

        try {
            const res = await fetch(`/api/habits/${id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
            });
            if (!res.ok) throw new Error('Ошибка обновления привычки');
        } catch {
            setHabits(prev);
        }
    }, []);

    const deleteHabit = useCallback(async (id: string) => {
        const prev = habitsRef.current;
        setHabits((h) => h.filter((x) => x.id !== id));

        try {
            const res = await fetch(`/api/habits/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Ошибка удаления привычки');
        } catch {
            setHabits(prev);
        }
    }, []);

    const logCompletion = useCallback(async (habitId: string, date: string) => {
        const prev = logsRef.current;
        const existing = prev.find((l) => l.habitId === habitId && l.date === date);
        setLogs((cur) =>
            existing
                ? cur.map((l) =>
                      l.habitId === habitId && l.date === date
                          ? { ...l, completions: l.completions + 1 }
                          : l
                  )
                : [...cur, { habitId, date, completions: 1 }]
        );

        try {
            const res = await fetch('/api/habits/logs/increment', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ habitId, date }),
            });
            if (!res.ok) throw new Error('Ошибка записи выполнения привычки');
            const updated = (await res.json()) as HabitLog;
            setLogs((cur) => {
                const withoutOld = cur.filter((l) => !(l.habitId === habitId && l.date === date));
                return [...withoutOld, updated];
            });
        } catch {
            setLogs(prev);
        }
    }, []);

    const logDecrement = useCallback(async (habitId: string, date: string) => {
        const prev = logsRef.current;
        const existing = prev.find((l) => l.habitId === habitId && l.date === date);
        if (!existing || existing.completions <= 0) return;

        setLogs((cur) =>
            existing.completions === 1
                ? cur.filter((l) => !(l.habitId === habitId && l.date === date))
                : cur.map((l) =>
                      l.habitId === habitId && l.date === date
                          ? { ...l, completions: l.completions - 1 }
                          : l
                  )
        );

        try {
            const res = await fetch('/api/habits/logs/decrement', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ habitId, date }),
            });
            if (!res.ok) throw new Error('Ошибка уменьшения выполнения привычки');
            const result = (await res.json()) as HabitLog | null;
            setLogs((cur) => {
                const withoutOld = cur.filter((l) => !(l.habitId === habitId && l.date === date));
                return result ? [...withoutOld, result] : withoutOld;
            });
        } catch {
            setLogs(prev);
        }
    }, []);

    const getLogForDate = useCallback(
        (habitId: string, date: string): HabitLog | undefined => {
            return logs.find((l) => l.habitId === habitId && l.date === date);
        },
        [logs]
    );

    const getLogsForMonth = useCallback(
        (habitId: string, year: number, month: number): HabitLog[] => {
            return logs.filter((l) => {
                if (l.habitId !== habitId) return false;
                const d = new Date(l.date);
                return d.getFullYear() === year && d.getMonth() === month;
            });
        },
        [logs]
    );

    const reorderHabits = useCallback(async (orderedIds: string[]) => {
        const prev = habitsRef.current;
        setHabits((cur) =>
            cur.map((h) => {
                const idx = orderedIds.indexOf(h.id);
                if (idx === -1) return h;
                return { ...h, order: idx };
            })
        );

        const reorderPayload = orderedIds.map((id, idx) => ({ id, order: idx }));
        try {
            const res = await fetch('/api/habits/reorder', {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reorderPayload),
            });
            if (!res.ok) throw new Error('Ошибка переупорядочивания привычек');
        } catch {
            setHabits(prev);
        }
    }, []);

    return {
        habits,
        logs,
        loading,
        error,
        addHabit,
        updateHabit,
        deleteHabit,
        logCompletion,
        logDecrement,
        getLogForDate,
        getLogsForMonth,
        reorderHabits,
    };
}
