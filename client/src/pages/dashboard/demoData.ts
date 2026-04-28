import type { User } from '@/types/auth-info-context.types';
import { SYSTEM_SECTIONS } from './constants';
import type {
    Challenge,
    ChallengeAssignment,
    Habit,
    HabitLog,
    Section,
    Task,
    WeeklyChallengePool,
} from './types';

export const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

export const DEMO_USER: User = {
    id: 1,
    email: import.meta.env.VITE_DEMO_EMAIL ?? 'demo@example.com',
    created_at: '2026-01-01T00:00:00.000Z',
};

export const DEMO_SECTIONS: Section[] = [...SYSTEM_SECTIONS];

const TODAY = new Date().toISOString().split('T')[0];
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const DEMO_TASKS: Task[] = [
    {
        id: 'demo-task-1',
        title: 'Изучить TypeScript generics',
        sectionId: 'today',
        tags: ['today'],
        status: 'active',
        pinned: true,
        order: 0,
        dueDate: TODAY,
        estimatedMinutes: 45,
        createdAt: '2026-04-20T10:00:00.000Z',
    },
    {
        id: 'demo-task-2',
        title: 'Написать unit-тесты для AuthContext',
        sectionId: 'all',
        tags: [],
        status: 'active',
        pinned: false,
        order: 1,
        estimatedMinutes: 60,
        createdAt: '2026-04-21T09:00:00.000Z',
    },
    {
        id: 'demo-task-3',
        title: 'Настроить Cloudflare Pages деплой',
        sectionId: 'all',
        tags: [],
        status: 'done',
        pinned: false,
        order: 2,
        completedAt: `${YESTERDAY}T18:30:00.000Z`,
        createdAt: '2026-04-22T08:00:00.000Z',
    },
    {
        id: 'demo-task-4',
        title: 'Ежедневная медитация',
        sectionId: 'recurring',
        tags: ['recurring'],
        status: 'active',
        pinned: false,
        order: 0,
        recurrence: { type: 'daily' },
        createdAt: '2026-04-01T07:00:00.000Z',
    },
    {
        id: 'demo-task-5',
        title: 'Обновить README проекта',
        sectionId: 'all',
        tags: [],
        status: 'active',
        pinned: false,
        order: 3,
        createdAt: '2026-04-25T11:00:00.000Z',
    },
];

export const DEMO_HABITS: Habit[] = [
    {
        id: 'demo-habit-1',
        name: 'Тренировка',
        icon: '🏋️',
        color: '#4CAF50',
        overflowColor: '#81C784',
        targetPerDay: 1,
        timeSlots: [],
        radius: 80,
        order: 0,
        createdAt: '2026-04-01T00:00:00.000Z',
    },
    {
        id: 'demo-habit-2',
        name: 'Свой проект',
        icon: '💻',
        color: '#2196F3',
        overflowColor: '#64B5F6',
        targetPerDay: 1,
        timeSlots: [],
        radius: 65,
        order: 1,
        createdAt: '2026-04-01T00:00:00.000Z',
    },
    {
        id: 'demo-habit-3',
        name: 'Экспандер',
        icon: '✊',
        color: '#FF9800',
        overflowColor: '#FFB74D',
        targetPerDay: 3,
        timeSlots: [],
        radius: 50,
        order: 2,
        createdAt: '2026-04-01T00:00:00.000Z',
    },
];

function buildDemoLogs(): HabitLog[] {
    const logs: HabitLog[] = [];
    const habitIds = ['demo-habit-1', 'demo-habit-2', 'demo-habit-3'];
    // Пропустить день -3 (имитация пропуска)
    const skipOffsets = new Set([3]);
    for (let i = 6; i >= 0; i--) {
        if (skipOffsets.has(i)) continue;
        const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        for (const habitId of habitIds) {
            // Habit-3 (targetPerDay: 3) — 2-3 выполнения
            const completions = habitId === 'demo-habit-3' ? (i % 2 === 0 ? 3 : 2) : 1;
            logs.push({ habitId, date, completions });
        }
    }
    return logs;
}
export const DEMO_HABIT_LOGS: HabitLog[] = buildDemoLogs();

export const DEMO_CHALLENGES: Challenge[] = [
    {
        id: 'demo-ch-1',
        title: '30 отжиманий',
        description: 'Каждый день без пропусков',
        createdAt: '2026-04-01T00:00:00.000Z',
    },
    {
        id: 'demo-ch-2',
        title: 'Прочитать 20 страниц',
        description: 'Художественная или техническая литература',
        createdAt: '2026-04-01T00:00:00.000Z',
    },
    { id: 'demo-ch-3', title: 'Холодный душ', createdAt: '2026-04-01T00:00:00.000Z' },
    { id: 'demo-ch-4', title: 'Без соцсетей до обеда', createdAt: '2026-04-01T00:00:00.000Z' },
    {
        id: 'demo-ch-5',
        title: 'Написать 100 строк кода',
        description: 'Не считая бойлерплейт',
        createdAt: '2026-04-01T00:00:00.000Z',
    },
];

function buildDemoAssignments(): ChallengeAssignment[] {
    const assignments: ChallengeAssignment[] = [
        {
            id: 'demo-a-today',
            challengeId: 'demo-ch-1',
            date: TODAY,
            status: 'active',
        },
    ];
    const pastChallenges: Array<{ id: string; status: 'done' | 'failed' }> = [
        { id: 'demo-ch-2', status: 'done' },
        { id: 'demo-ch-3', status: 'failed' },
        { id: 'demo-ch-4', status: 'done' },
        { id: 'demo-ch-5', status: 'done' },
    ];
    pastChallenges.forEach(({ id, status }, i) => {
        const date = new Date(Date.now() - (i + 1) * 86400000).toISOString().split('T')[0];
        assignments.push({
            id: `demo-a-past-${i + 1}`,
            challengeId: id,
            date,
            status,
            completedAt: status === 'done' ? `${date}T20:00:00.000Z` : undefined,
        });
    });
    return assignments;
}
export const DEMO_ASSIGNMENTS: ChallengeAssignment[] = buildDemoAssignments();

function getWeekStartDate(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    return monday.toISOString().split('T')[0];
}

export const DEMO_WEEK_POOL: WeeklyChallengePool = {
    weekStart: getWeekStartDate(),
    challengeIds: ['demo-ch-1', 'demo-ch-2', 'demo-ch-3', 'demo-ch-4', 'demo-ch-5'],
    confirmedAt: '2026-04-28T00:00:00.000Z',
};
