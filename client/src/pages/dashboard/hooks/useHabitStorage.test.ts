import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Habit, HabitLog } from '../types';
import { useHabitStorage } from './useHabitStorage';

const HABIT: Habit = {
    id: 'h1',
    name: 'Тренировка',
    icon: '🏋️',
    color: '#4CAF50',
    overflowColor: '#81C784',
    targetPerDay: 1,
    timeSlots: [],
    radius: 80,
    createdAt: '2026-04-08T00:00:00.000Z',
    order: 0,
};

const LOG: HabitLog = { habitId: 'h1', date: '2026-04-08', completions: 1 };

function mockFetch(habits: Habit[], logs: HabitLog[]) {
    global.fetch = vi.fn((url: RequestInfo | URL) => {
        const urlStr = url.toString();
        if (urlStr.includes('/logs')) {
            return Promise.resolve(new Response(JSON.stringify(logs), { status: 200 }));
        }
        return Promise.resolve(new Response(JSON.stringify(habits), { status: 200 }));
    }) as typeof fetch;
}

afterEach(() => vi.restoreAllMocks());

describe('useHabitStorage — загрузка', () => {
    it('загружает привычки и логи при mount', async () => {
        mockFetch([HABIT], [LOG]);

        const { result } = renderHook(() => useHabitStorage());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.habits).toEqual([HABIT]);
        expect(result.current.logs).toEqual([LOG]);
        expect(result.current.error).toBeNull();
    });

    it('создаёт дефолтные привычки если API вернул пустой массив', async () => {
        global.fetch = vi.fn((url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();
            if (urlStr.includes('/logs')) {
                return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
            }
            if (options?.method === 'POST') {
                return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
            }
            return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
        }) as typeof fetch;

        const { result } = renderHook(() => useHabitStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Дефолтные привычки: Тренировка, Свой проект, Экспандер
        expect(result.current.habits).toHaveLength(3);
        expect(result.current.habits.map((h) => h.name)).toEqual([
            'Тренировка',
            'Свой проект',
            'Экспандер',
        ]);
    });

    it('устанавливает error при ошибке загрузки', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve(new Response('{}', { status: 500 }))
        ) as typeof fetch;

        const { result } = renderHook(() => useHabitStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBeTruthy();
    });
});

describe('useHabitStorage — мутации', () => {
    it('addHabit — оптимистично добавляет привычку', async () => {
        const created: Habit = { ...HABIT, id: 'server-h2', name: 'Медитация' };
        global.fetch = vi.fn((url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();
            if (urlStr.includes('/logs')) {
                return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
            }
            if (options?.method === 'POST') {
                return Promise.resolve(new Response(JSON.stringify(created), { status: 200 }));
            }
            return Promise.resolve(new Response(JSON.stringify([HABIT]), { status: 200 }));
        }) as typeof fetch;

        const { result } = renderHook(() => useHabitStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.addHabit({
                name: 'Медитация',
                icon: '🧘',
                color: '#9C27B0',
                overflowColor: '#BA68C8',
                targetPerDay: 1,
                timeSlots: [],
                radius: 65,
            });
        });

        expect(result.current.habits.some((h) => h.name === 'Медитация')).toBe(true);
    });

    it('deleteHabit — оптимистично убирает привычку', async () => {
        global.fetch = vi.fn((url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();
            if (urlStr.includes('/logs')) {
                return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
            }
            if (options?.method === 'DELETE') {
                return Promise.resolve(new Response(null, { status: 204 }));
            }
            return Promise.resolve(new Response(JSON.stringify([HABIT]), { status: 200 }));
        }) as typeof fetch;

        const { result } = renderHook(() => useHabitStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.habits).toHaveLength(1);

        await act(async () => {
            await result.current.deleteHabit('h1');
        });

        expect(result.current.habits).toHaveLength(0);
    });

    it('logCompletion — создаёт лог если его нет', async () => {
        const newLog: HabitLog = { habitId: 'h1', date: '2026-04-08', completions: 1 };
        global.fetch = vi.fn((url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();
            if (urlStr.includes('/logs') && options?.method === 'POST') {
                return Promise.resolve(new Response(JSON.stringify(newLog), { status: 200 }));
            }
            if (urlStr.includes('/logs')) {
                return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
            }
            return Promise.resolve(new Response(JSON.stringify([HABIT]), { status: 200 }));
        }) as typeof fetch;

        const { result } = renderHook(() => useHabitStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.logCompletion('h1', '2026-04-08');
        });

        expect(result.current.logs.find((l) => l.habitId === 'h1')?.completions).toBe(1);
    });

    it('logCompletion — инкрементирует существующий лог', async () => {
        const updatedLog: HabitLog = { habitId: 'h1', date: '2026-04-08', completions: 2 };
        global.fetch = vi.fn((url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();
            if (urlStr.includes('/logs') && options?.method === 'POST') {
                return Promise.resolve(new Response(JSON.stringify(updatedLog), { status: 200 }));
            }
            if (urlStr.includes('/logs')) {
                return Promise.resolve(new Response(JSON.stringify([LOG]), { status: 200 }));
            }
            return Promise.resolve(new Response(JSON.stringify([HABIT]), { status: 200 }));
        }) as typeof fetch;

        const { result } = renderHook(() => useHabitStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.logCompletion('h1', '2026-04-08');
        });

        expect(result.current.logs.find((l) => l.habitId === 'h1')?.completions).toBe(2);
    });

    it('logDecrement — удаляет лог при completions=1', async () => {
        global.fetch = vi.fn((url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();
            if (urlStr.includes('/logs') && options?.method === 'POST') {
                return Promise.resolve(new Response(JSON.stringify(null), { status: 200 }));
            }
            if (urlStr.includes('/logs')) {
                return Promise.resolve(new Response(JSON.stringify([LOG]), { status: 200 }));
            }
            return Promise.resolve(new Response(JSON.stringify([HABIT]), { status: 200 }));
        }) as typeof fetch;

        const { result } = renderHook(() => useHabitStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.logDecrement('h1', '2026-04-08');
        });

        expect(result.current.logs.find((l) => l.habitId === 'h1')).toBeUndefined();
    });
});

describe('useHabitStorage — getLogForDate', () => {
    it('возвращает лог для конкретной привычки и даты', async () => {
        mockFetch([HABIT], [LOG]);

        const { result } = renderHook(() => useHabitStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.getLogForDate('h1', '2026-04-08')).toEqual(LOG);
        expect(result.current.getLogForDate('h1', '2026-04-07')).toBeUndefined();
    });
});
