import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Challenge, ChallengeAssignment, WeeklyChallengePool } from '../types';
import { useChallengeStorage } from './useChallengeStorage';

const CHALLENGE: Challenge = {
    id: 'c1',
    title: 'Тест',
    createdAt: '2026-04-08T00:00:00.000Z',
};

const ASSIGNMENT: ChallengeAssignment = {
    id: 'a1',
    challengeId: 'c1',
    date: '2026-04-08',
    status: 'active',
};

const WEEK_POOL: WeeklyChallengePool = {
    weekStart: '2026-04-06',
    challengeIds: ['c1'],
    confirmedAt: '2026-04-08T00:00:00.000Z',
};

function mockFetch(
    challengesBody: Challenge[],
    dailyCheckBody: { assignments: ChallengeAssignment[]; weekPool: WeeklyChallengePool | null }
) {
    global.fetch = vi.fn((url: RequestInfo | URL) => {
        const urlStr = url.toString();
        if (urlStr.includes('/daily-check')) {
            return Promise.resolve(new Response(JSON.stringify(dailyCheckBody), { status: 200 }));
        }
        return Promise.resolve(new Response(JSON.stringify(challengesBody), { status: 200 }));
    }) as typeof fetch;
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useChallengeStorage — загрузка', () => {
    it('загружает челленджи и данные daily-check при mount', async () => {
        mockFetch([CHALLENGE], { assignments: [ASSIGNMENT], weekPool: WEEK_POOL });

        const { result } = renderHook(() => useChallengeStorage());

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.challenges).toEqual([CHALLENGE]);
        expect(result.current.assignments).toEqual([ASSIGNMENT]);
        expect(result.current.weekPool).toEqual(WEEK_POOL);
        expect(result.current.error).toBeNull();
    });

    it('вызывает POST /api/challenges/daily-check при загрузке', async () => {
        mockFetch([CHALLENGE], { assignments: [ASSIGNMENT], weekPool: null });

        const { result } = renderHook(() => useChallengeStorage());

        await waitFor(() => expect(result.current.loading).toBe(false));

        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const dailyCheckCall = calls.find(([url]: [RequestInfo | URL]) =>
            url.toString().includes('/daily-check')
        );
        expect(dailyCheckCall).toBeDefined();
        expect(dailyCheckCall?.[1]?.method).toBe('POST');
    });

    it('устанавливает error при ошибке загрузки', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve(
                new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
            )
        ) as typeof fetch;

        const { result } = renderHook(() => useChallengeStorage());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBeTruthy();
        expect(result.current.challenges).toEqual([]);
    });

    it('загружает данные при Strict Mode (cancelled не блокирует remount)', async () => {
        mockFetch([CHALLENGE], { assignments: [ASSIGNMENT], weekPool: WEEK_POOL });

        const { result } = renderHook(() => useChallengeStorage(), {
            wrapper: ({ children }) => React.createElement(React.StrictMode, null, children),
        });

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Ключевой кейс: при Strict Mode (mount→cleanup→remount) данные должны загрузиться
        expect(result.current.challenges).toEqual([CHALLENGE]);
        expect(result.current.assignments).toEqual([ASSIGNMENT]);
    });
});

describe('useChallengeStorage — мутации', () => {
    beforeEach(() => {
        mockFetch([CHALLENGE], { assignments: [ASSIGNMENT], weekPool: WEEK_POOL });
    });

    it('addChallenge — оптимистично добавляет челлендж', async () => {
        const newChallenge: Challenge = {
            id: 'c2',
            title: 'Новый',
            createdAt: '2026-04-08T00:00:00.000Z',
        };
        global.fetch = vi.fn((url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();
            if (urlStr.includes('/daily-check')) {
                return Promise.resolve(
                    new Response(JSON.stringify({ assignments: [], weekPool: null }), {
                        status: 200,
                    })
                );
            }
            if (options?.method === 'POST') {
                return Promise.resolve(new Response(JSON.stringify(newChallenge), { status: 200 }));
            }
            return Promise.resolve(new Response(JSON.stringify([CHALLENGE]), { status: 200 }));
        }) as typeof fetch;

        const { result } = renderHook(() => useChallengeStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.addChallenge({ title: 'Новый' });
        });

        expect(result.current.challenges.some((c) => c.title === 'Новый')).toBe(true);
    });

    it('deleteChallenge — оптимистично убирает челлендж из state', async () => {
        global.fetch = vi.fn((url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();
            if (urlStr.includes('/daily-check')) {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({ assignments: [ASSIGNMENT], weekPool: WEEK_POOL }),
                        {
                            status: 200,
                        }
                    )
                );
            }
            if (options?.method === 'DELETE') {
                return Promise.resolve(new Response(null, { status: 204 }));
            }
            return Promise.resolve(new Response(JSON.stringify([CHALLENGE]), { status: 200 }));
        }) as typeof fetch;

        const { result } = renderHook(() => useChallengeStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.challenges).toHaveLength(1);

        await act(async () => {
            await result.current.deleteChallenge('c1');
        });

        expect(result.current.challenges).toHaveLength(0);
    });

    it('completeAssignment — меняет статус на done', async () => {
        global.fetch = vi.fn((url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();
            if (urlStr.includes('/daily-check')) {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({ assignments: [ASSIGNMENT], weekPool: WEEK_POOL }),
                        {
                            status: 200,
                        }
                    )
                );
            }
            if (options?.method === 'PUT') {
                return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
            }
            return Promise.resolve(new Response(JSON.stringify([CHALLENGE]), { status: 200 }));
        }) as typeof fetch;

        const { result } = renderHook(() => useChallengeStorage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.completeAssignment('a1');
        });

        expect(result.current.assignments.find((a) => a.id === 'a1')?.status).toBe('done');
    });
});
