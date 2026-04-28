import { useCallback, useEffect, useMemo, useState } from 'react';
import { SYSTEM_SECTIONS } from '../constants';
import { DEMO_SECTIONS, DEMO_TASKS, IS_DEMO } from '../demoData';
import type { Section, Task } from '../types';
import { nextOccurrence, todayISO } from '../utils/recurrence';

const today = (): string => new Date().toISOString().split('T')[0];

const DONE_AT_BOTTOM_KEY = 'dashboard.doneAtBottom';

function readDoneAtBottom(): boolean {
    try {
        return localStorage.getItem(DONE_AT_BOTTOM_KEY) === 'true';
    } catch {
        return false;
    }
}

export function useTaskStorage() {
    const [tasks, setTasks] = useState<Task[]>(IS_DEMO ? DEMO_TASKS : []);
    const [sections, setSections] = useState<Section[]>(IS_DEMO ? DEMO_SECTIONS : SYSTEM_SECTIONS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [doneAtBottom, setDoneAtBottomState] = useState<boolean>(readDoneAtBottom);

    const setDoneAtBottom = useCallback((v: boolean) => {
        setDoneAtBottomState(v);
        try {
            localStorage.setItem(DONE_AT_BOTTOM_KEY, String(v));
        } catch {
            // ignore storage errors
        }
    }, []);

    const sortTasks = useCallback(
        (list: Task[]): Task[] =>
            [...list].sort((a, b) => {
                if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                if (doneAtBottom) {
                    if (a.status === 'done' && b.status !== 'done') return 1;
                    if (a.status !== 'done' && b.status === 'done') return -1;
                }
                return a.order - b.order;
            }),
        [doneAtBottom]
    );

    useEffect(() => {
        if (IS_DEMO) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        async function load() {
            try {
                const [tasksRes, sectionsRes] = await Promise.all([
                    fetch('/api/tasks', { credentials: 'include' }),
                    fetch('/api/sections', { credentials: 'include' }),
                ]);

                if (!tasksRes.ok || !sectionsRes.ok) {
                    throw new Error('Ошибка загрузки данных');
                }

                const [tasksData, sectionsData] = await Promise.all([
                    tasksRes.json() as Promise<Task[]>,
                    sectionsRes.json() as Promise<Section[]>,
                ]);

                if (!cancelled) {
                    setTasks(tasksData);
                    setSections([...SYSTEM_SECTIONS, ...sectionsData]);
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

    const addTask = useCallback(
        async (data: Omit<Task, 'id' | 'createdAt' | 'order'>) => {
            const tempId = crypto.randomUUID();
            const maxOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.order)) : -1;
            const optimistic: Task = {
                ...data,
                id: tempId,
                createdAt: new Date().toISOString(),
                order: maxOrder + 1,
            };
            const prev = tasks;
            setTasks((cur) => [...cur, optimistic]);
            if (IS_DEMO) return;

            try {
                const res = await fetch('/api/tasks', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(optimistic),
                });
                if (!res.ok) throw new Error('Ошибка создания задачи');
                const created = (await res.json()) as Task;
                setTasks((cur) => cur.map((t) => (t.id === tempId ? created : t)));
            } catch {
                setTasks(prev);
            }
        },
        [tasks]
    );

    const updateTask = useCallback(
        async (id: string, patch: Partial<Task>) => {
            const prev = tasks;
            setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, ...patch } : t)));
            if (IS_DEMO) return;

            try {
                const res = await fetch(`/api/tasks/${id}`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(patch),
                });
                if (!res.ok) throw new Error('Ошибка обновления задачи');
            } catch {
                setTasks(prev);
            }
        },
        [tasks]
    );

    const deleteTask = useCallback(
        async (id: string) => {
            const prev = tasks;
            setTasks((cur) => cur.filter((t) => t.id !== id));
            if (IS_DEMO) return;

            try {
                const res = await fetch(`/api/tasks/${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
                if (!res.ok) throw new Error('Ошибка удаления задачи');
            } catch {
                setTasks(prev);
            }
        },
        [tasks]
    );

    const toggleDone = useCallback(
        async (id: string) => {
            const task = tasks.find((t) => t.id === id);
            if (!task) return;

            if (task.recurrence) {
                if (task.status === 'done') {
                    await updateTask(id, {
                        status: 'active',
                        completedAt: null,
                    } as Partial<Task>);
                    return;
                }
                const now = new Date().toISOString();
                const base = task.dueDate ?? todayISO();
                const nextDue = nextOccurrence(base, task.recurrence);
                const patch: Partial<Task> = {
                    status: 'done',
                    completedAt: now,
                    dueDate: nextDue,
                    completionLog: [...(task.completionLog ?? []), now],
                    completedCount: (task.completedCount ?? 0) + 1,
                };
                await updateTask(id, patch);
                return;
            }

            let patch: Partial<Task> & { completedAt?: string | null };
            if (task.status === 'done') {
                patch = { status: 'active', completedAt: null };
            } else {
                patch = { status: 'done', completedAt: new Date().toISOString() };
            }

            await updateTask(id, patch);
        },
        [tasks, updateTask]
    );

    const togglePin = useCallback(
        async (id: string) => {
            const task = tasks.find((t) => t.id === id);
            if (!task) return;
            await updateTask(id, { pinned: !task.pinned });
        },
        [tasks, updateTask]
    );

    const reorderTasks = useCallback(
        async (_sectionId: string, orderedIds: string[]) => {
            const prev = tasks;
            setTasks((cur) =>
                cur.map((t) => {
                    const idx = orderedIds.indexOf(t.id);
                    if (idx === -1) return t;
                    return { ...t, order: idx };
                })
            );
            if (IS_DEMO) return;

            const reorderPayload = orderedIds.map((id, idx) => ({ id, order: idx }));
            try {
                const res = await fetch('/api/tasks/reorder', {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reorderPayload),
                });
                if (!res.ok) throw new Error('Ошибка переупорядочивания задач');
            } catch {
                setTasks(prev);
            }
        },
        [tasks]
    );

    const addSection = useCallback(
        async (name: string) => {
            const userSections = sections.filter((s) => !s.isSystem);
            const maxOrder =
                userSections.length > 0 ? Math.max(...userSections.map((s) => s.order)) : -1;
            const newSection: Section = {
                id: crypto.randomUUID(),
                name,
                order: maxOrder + 1,
                isSystem: false,
            };
            const prev = sections;
            setSections((cur) => [...cur, newSection]);
            if (IS_DEMO) return;

            try {
                const res = await fetch('/api/sections', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: newSection.id, name, order: newSection.order }),
                });
                if (!res.ok) throw new Error('Ошибка создания секции');
            } catch {
                setSections(prev);
            }
        },
        [sections]
    );

    const updateSection = useCallback(
        async (id: string, name: string) => {
            const prev = sections;
            setSections((cur) => cur.map((s) => (s.id === id ? { ...s, name } : s)));
            if (IS_DEMO) return;

            try {
                const res = await fetch(`/api/sections/${id}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name }),
                });
                if (!res.ok) throw new Error('Ошибка обновления секции');
            } catch {
                setSections(prev);
            }
        },
        [sections]
    );

    const deleteSection = useCallback(
        async (id: string) => {
            const prevSections = sections;
            const prevTasks = tasks;
            setSections((cur) => cur.filter((s) => s.id !== id));
            setTasks((cur) =>
                cur.map((t) => (t.sectionId === id ? { ...t, sectionId: 'all' } : t))
            );
            if (IS_DEMO) return;

            try {
                const res = await fetch(`/api/sections/${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
                if (!res.ok) throw new Error('Ошибка удаления секции');
            } catch {
                setSections(prevSections);
                setTasks(prevTasks);
            }
        },
        [sections, tasks]
    );

    const getTasksBySection = useCallback(
        (sectionId: string): Task[] => {
            const todayStr = today();
            let filtered: Task[];

            switch (sectionId) {
                case 'all':
                    filtered = tasks.filter((t) => t.status !== 'archived');
                    break;
                case 'today':
                    filtered = tasks.filter(
                        (t) =>
                            (t.sectionId === 'today' ||
                                t.dueDate === todayStr ||
                                t.tags.includes('today')) &&
                            t.status !== 'archived'
                    );
                    break;
                case 'recurring':
                    filtered = tasks.filter(
                        (t) =>
                            (t.sectionId === 'recurring' ||
                                t.tags.includes('recurring') ||
                                t.recurrence !== undefined) &&
                            t.status !== 'archived'
                    );
                    break;
                case 'profile':
                    filtered = tasks.filter(
                        (t) =>
                            (t.sectionId === 'profile' || t.tags.includes('profile')) &&
                            t.status !== 'archived'
                    );
                    break;
                default:
                    filtered = tasks.filter(
                        (t) => t.sectionId === sectionId && t.status !== 'archived'
                    );
            }

            return sortTasks(filtered);
        },
        [tasks, sortTasks]
    );

    const archivedTasks = useMemo(
        () =>
            [...tasks]
                .filter((t) => t.status === 'archived')
                .sort((a, b) => {
                    const aTime = a.completedAt ?? a.createdAt;
                    const bTime = b.completedAt ?? b.createdAt;
                    return bTime.localeCompare(aTime);
                }),
        [tasks]
    );

    const restoreTask = useCallback(
        (id: string) => updateTask(id, { status: 'active' }),
        [updateTask]
    );

    return {
        tasks,
        sections,
        loading,
        error,
        addTask,
        updateTask,
        deleteTask,
        toggleDone,
        togglePin,
        reorderTasks,
        addSection,
        updateSection,
        deleteSection,
        getTasksBySection,
        archivedTasks,
        restoreTask,
        doneAtBottom,
        setDoneAtBottom,
    };
}
