import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SYSTEM_SECTIONS } from '../constants';
import type { Section, Task } from '../types';
import { useTaskStorage } from './useTaskStorage';

const TASK: Task = {
    id: 't1',
    title: 'Тест задача',
    status: 'active',
    order: 0,
    tags: [],
    pinned: false,
    createdAt: '2026-04-08T00:00:00.000Z',
    sectionId: 'all',
};

const SECTION: Section = { id: 's1', name: 'Работа', order: 0, isSystem: false };

function mockFetch(tasks: Task[], sections: Section[]) {
    global.fetch = vi.fn((url: RequestInfo | URL) => {
        const urlStr = url.toString();
        if (urlStr.includes('/api/sections')) {
            return Promise.resolve(new Response(JSON.stringify(sections), { status: 200 }));
        }
        return Promise.resolve(new Response(JSON.stringify(tasks), { status: 200 }));
    }) as typeof fetch;
}

afterEach(() => vi.restoreAllMocks());

describe('useTaskStorage — загрузка', () => {
    it('загружает задачи и объединяет системные + пользовательские разделы', async () => {
        mockFetch([TASK], [SECTION]);

        const { result } = renderHook(() => useTaskStorage());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.tasks).toEqual([TASK]);
        expect(result.current.sections).toEqual([...SYSTEM_SECTIONS, SECTION]);
        expect(result.current.error).toBeNull();
    });

    it('sections содержат системные разделы даже если API вернул пустой массив', async () => {
        mockFetch([], []);

        const { result } = renderHook(() => useTaskStorage());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.sections.filter((s) => s.isSystem)).toHaveLength(
            SYSTEM_SECTIONS.length
        );
    });

    it('устанавливает error при ошибке загрузки', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve(new Response('{}', { status: 500 }))
        ) as typeof fetch;

        const { result } = renderHook(() => useTaskStorage());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBeTruthy();
    });
});

describe('useTaskStorage — мутации задач', () => {
    it('addTask — оптимистично добавляет задачу', async () => {
        const created: Task = { ...TASK, id: 'server-id' };
        global.fetch = vi.fn((url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();
            if (urlStr.includes('/api/sections')) {
                return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
            }
            if (options?.method === 'POST') {
                return Promise.resolve(new Response(JSON.stringify(created), { status: 200 }));
            }
            return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
        }) as typeof fetch;

        const { result } = renderHook(() => useTaskStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.addTask({
                title: 'Новая',
                status: 'active',
                order: 0,
                tags: [],
                pinned: false,
                sectionId: 'all',
            });
        });

        expect(result.current.tasks.some((t) => t.id === 'server-id')).toBe(true);
    });

    it('deleteTask — оптимистично убирает задачу', async () => {
        global.fetch = vi.fn((url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();
            if (urlStr.includes('/api/sections')) {
                return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
            }
            if (options?.method === 'DELETE') {
                return Promise.resolve(new Response(null, { status: 204 }));
            }
            return Promise.resolve(new Response(JSON.stringify([TASK]), { status: 200 }));
        }) as typeof fetch;

        const { result } = renderHook(() => useTaskStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.tasks).toHaveLength(1);

        await act(async () => {
            await result.current.deleteTask('t1');
        });

        expect(result.current.tasks).toHaveLength(0);
    });

    it('toggleDone — active → done', async () => {
        global.fetch = vi.fn((url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();
            if (urlStr.includes('/api/sections')) {
                return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
            }
            if (options?.method === 'PATCH') {
                return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
            }
            return Promise.resolve(new Response(JSON.stringify([TASK]), { status: 200 }));
        }) as typeof fetch;

        const { result } = renderHook(() => useTaskStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.toggleDone('t1');
        });

        expect(result.current.tasks.find((t) => t.id === 't1')?.status).toBe('done');
    });

    it('toggleDone — done → active', async () => {
        const doneTask: Task = { ...TASK, status: 'done', completedAt: '2026-04-08T00:00:00.000Z' };
        global.fetch = vi.fn((url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();
            if (urlStr.includes('/api/sections')) {
                return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
            }
            if (options?.method === 'PATCH') {
                return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
            }
            return Promise.resolve(new Response(JSON.stringify([doneTask]), { status: 200 }));
        }) as typeof fetch;

        const { result } = renderHook(() => useTaskStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.toggleDone('t1');
        });

        expect(result.current.tasks.find((t) => t.id === 't1')?.status).toBe('active');
    });
});

describe('useTaskStorage — getTasksBySection', () => {
    it('all — возвращает все кроме archived', async () => {
        const archived: Task = { ...TASK, id: 't2', status: 'archived' };
        mockFetch([TASK, archived], []);

        const { result } = renderHook(() => useTaskStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        const tasks = result.current.getTasksBySection('all');
        expect(tasks.map((t) => t.id)).toEqual(['t1']);
    });

    it('today — возвращает задачи с dueDate=сегодня', async () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTask: Task = { ...TASK, id: 't2', dueDate: todayStr };
        mockFetch([TASK, todayTask], []);

        const { result } = renderHook(() => useTaskStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        const tasks = result.current.getTasksBySection('today');
        expect(tasks.map((t) => t.id)).toEqual(['t2']);
    });

    it('recurring — возвращает задачи с тегом recurring', async () => {
        const recurring: Task = { ...TASK, id: 't2', tags: ['recurring'] };
        mockFetch([TASK, recurring], []);

        const { result } = renderHook(() => useTaskStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        const tasks = result.current.getTasksBySection('recurring');
        expect(tasks.map((t) => t.id)).toEqual(['t2']);
    });

    it('пользовательский раздел — фильтрует по sectionId', async () => {
        const sectionTask: Task = { ...TASK, id: 't2', sectionId: 's1' };
        mockFetch([TASK, sectionTask], [SECTION]);

        const { result } = renderHook(() => useTaskStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        const tasks = result.current.getTasksBySection('s1');
        expect(tasks.map((t) => t.id)).toEqual(['t2']);
    });
});
