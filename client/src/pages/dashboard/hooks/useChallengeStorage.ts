import { useCallback, useEffect, useRef, useState } from 'react';
import { DEMO_ASSIGNMENTS, DEMO_CHALLENGES, DEMO_WEEK_POOL, IS_DEMO } from '../demoData';
import type {
    Challenge,
    ChallengeAssignment,
    DailyCheckResponse,
    SwapTodayResponse,
    WeeklyChallengePool,
} from '../types';

const API_BASE = '/api/challenges';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw Object.assign(new Error((body as { error?: string }).error ?? res.statusText), {
            status: res.status,
        });
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

interface ChallengeStorageState {
    challenges: Challenge[];
    assignments: ChallengeAssignment[];
    weekPool: WeeklyChallengePool | null;
    loading: boolean;
    error: string | null;
}

export function useChallengeStorage() {
    const [state, setState] = useState<ChallengeStorageState>(
        IS_DEMO
            ? {
                  challenges: DEMO_CHALLENGES,
                  assignments: DEMO_ASSIGNMENTS,
                  weekPool: DEMO_WEEK_POOL,
                  loading: false,
                  error: null,
              }
            : { challenges: [], assignments: [], weekPool: null, loading: true, error: null }
    );
    const assignmentsRef = useRef(state.assignments);
    assignmentsRef.current = state.assignments;

    useEffect(() => {
        if (IS_DEMO) return;

        let cancelled = false;

        async function load() {
            try {
                const [challenges, dailyCheck] = await Promise.all([
                    apiFetch<Challenge[]>(API_BASE),
                    apiFetch<DailyCheckResponse>(`${API_BASE}/daily-check`, { method: 'POST' }),
                ]);

                if (!cancelled) {
                    setState({
                        challenges,
                        assignments: dailyCheck.assignments,
                        weekPool: dailyCheck.weekPool,
                        loading: false,
                        error: null,
                    });
                }
            } catch (err) {
                if (!cancelled) {
                    const error = err instanceof Error ? err.message : 'Ошибка загрузки';
                    setState((prev) => ({ ...prev, loading: false, error }));
                }
            }
        }

        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    const addChallenge = useCallback(async (data: Omit<Challenge, 'id' | 'createdAt'>) => {
        const newChallenge: Challenge = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };

        setState((prev) => ({
            ...prev,
            challenges: [...prev.challenges, newChallenge],
        }));
        if (IS_DEMO) return;

        try {
            await apiFetch<Challenge>(API_BASE, {
                method: 'POST',
                body: JSON.stringify(newChallenge),
            });
        } catch (err) {
            setState((prev) => ({
                ...prev,
                challenges: prev.challenges.filter((c) => c.id !== newChallenge.id),
                error: err instanceof Error ? err.message : 'Ошибка создания',
            }));
        }
    }, []);

    const updateChallenge = useCallback(
        async (id: string, patch: Partial<Omit<Challenge, 'id' | 'createdAt'>>) => {
            setState((prev) => ({
                ...prev,
                challenges: prev.challenges.map((c) => (c.id === id ? { ...c, ...patch } : c)),
            }));
            if (IS_DEMO) return;

            try {
                await apiFetch<Challenge>(`${API_BASE}/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(patch),
                });
            } catch (err) {
                const rows = await apiFetch<Challenge[]>(API_BASE).catch(() => null);
                setState((prev) => ({
                    ...prev,
                    challenges: rows ?? prev.challenges,
                    error: err instanceof Error ? err.message : 'Ошибка обновления',
                }));
            }
        },
        []
    );

    const deleteChallenge = useCallback(async (id: string) => {
        setState((prev) => ({
            ...prev,
            challenges: prev.challenges.filter((c) => c.id !== id),
        }));
        if (IS_DEMO) return;

        try {
            await apiFetch<void>(`${API_BASE}/${id}`, { method: 'DELETE' });
        } catch (err) {
            const rows = await apiFetch<Challenge[]>(API_BASE).catch(() => null);
            setState((prev) => ({
                ...prev,
                challenges: rows ?? prev.challenges,
                error: err instanceof Error ? err.message : 'Ошибка удаления',
            }));
        }
    }, []);

    const completeAssignment = useCallback(async (id: string) => {
        const completedAt = new Date().toISOString();

        setState((prev) => ({
            ...prev,
            assignments: prev.assignments.map((a) =>
                a.id === id ? { ...a, status: 'done' as const, completedAt } : a
            ),
        }));
        if (IS_DEMO) return;

        try {
            await apiFetch(`${API_BASE}/assignments/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'done', completedAt }),
            });
        } catch (err) {
            setState((prev) => ({
                ...prev,
                assignments: prev.assignments.map((a) =>
                    a.id === id ? { ...a, status: 'active' as const, completedAt: undefined } : a
                ),
                error: err instanceof Error ? err.message : 'Ошибка обновления',
            }));
        }
    }, []);

    const reactivateAssignment = useCallback(async (id: string) => {
        let prevStatus: ChallengeAssignment['status'] = 'done';
        let prevCompletedAt: string | undefined;

        setState((s) => {
            const found = s.assignments.find((a) => a.id === id);
            if (found) {
                prevStatus = found.status;
                prevCompletedAt = found.completedAt;
            }
            return {
                ...s,
                assignments: s.assignments.map((a) =>
                    a.id === id ? { ...a, status: 'active' as const, completedAt: undefined } : a
                ),
            };
        });
        if (IS_DEMO) return;

        try {
            await apiFetch(`${API_BASE}/assignments/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'active' }),
            });
        } catch (err) {
            setState((s) => ({
                ...s,
                assignments: s.assignments.map((a) =>
                    a.id === id ? { ...a, status: prevStatus, completedAt: prevCompletedAt } : a
                ),
                error: err instanceof Error ? err.message : 'Ошибка отмены',
            }));
        }
    }, []);

    const failAssignment = useCallback(async (id: string) => {
        setState((prev) => ({
            ...prev,
            assignments: prev.assignments.map((a) =>
                a.id === id ? { ...a, status: 'failed' as const } : a
            ),
        }));
        if (IS_DEMO) return;

        try {
            await apiFetch(`${API_BASE}/assignments/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'failed' }),
            });
        } catch (err) {
            setState((prev) => ({
                ...prev,
                assignments: prev.assignments.map((a) =>
                    a.id === id ? { ...a, status: 'active' as const } : a
                ),
                error: err instanceof Error ? err.message : 'Ошибка обновления',
            }));
        }
    }, []);

    const swapToday = useCallback(async (newChallengeId: string) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const snapshot = assignmentsRef.current;

        setState((prev) => ({
            ...prev,
            assignments: prev.assignments.map((a) =>
                a.date === todayStr && a.status === 'active'
                    ? { ...a, challengeId: newChallengeId }
                    : a
            ),
        }));
        if (IS_DEMO) return;

        try {
            await apiFetch<SwapTodayResponse>(`${API_BASE}/swap-today`, {
                method: 'POST',
                body: JSON.stringify({ newChallengeId }),
            });
        } catch (err) {
            setState((prev) => ({
                ...prev,
                assignments: snapshot,
                error: err instanceof Error ? err.message : 'Ошибка замены',
            }));
        }
    }, []);

    return {
        challenges: state.challenges,
        assignments: state.assignments,
        weekPool: state.weekPool,
        loading: state.loading,
        error: state.error,
        addChallenge,
        updateChallenge,
        deleteChallenge,
        completeAssignment,
        failAssignment,
        reactivateAssignment,
        swapToday,
    };
}
