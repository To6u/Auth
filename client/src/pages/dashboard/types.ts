export type RecurrenceType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom';

export type RecurrenceUnit = 'day' | 'week' | 'month';

export interface Recurrence {
    type: RecurrenceType;
    interval?: number;
    unit?: RecurrenceUnit;
}

export interface Reminders {
    enabled: boolean;
    times: string[];
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    sectionId: string;
    tags: string[];
    status: 'active' | 'done' | 'archived';
    pinned: boolean;
    order: number;
    dueDate?: string;
    notification?: {
        enabled: boolean;
        offsetMinutes: number;
    };
    estimatedMinutes?: number;
    completedAt?: string | null;
    createdAt: string;
    recurrence?: Recurrence;
    reminders?: Reminders;
    completionLog?: string[];
    completedCount?: number;
}

export interface Section {
    id: string;
    name: string;
    order: number;
    isSystem: boolean;
}

export interface Habit {
    id: string;
    name: string;
    icon: string;
    color: string;
    overflowColor: string;
    targetPerDay: number;
    timeSlots: string[];
    radius: number;
    order: number;
    createdAt: string;
}

export interface HabitLog {
    habitId: string;
    date: string;
    completions: number;
}

export type HabitViewMode = 'today' | 'month' | 'year';

export interface Challenge {
    id: string;
    title: string;
    description?: string;
    // TODO(tech-debt): icon не сохраняется на сервере — нужна миграция DB (severity: Low)
    icon?: string;
    createdAt: string;
}

export interface ChallengeAssignment {
    id: string;
    challengeId: string;
    date: string;
    status: 'active' | 'done' | 'failed';
    completedAt?: string;
}

export interface WeeklyChallengePool {
    weekStart: string;
    challengeIds: string[];
    confirmedAt?: string;
}

export interface WeeklySummary {
    weekStart: string;
    completed: ChallengeAssignment[];
    failed: ChallengeAssignment[];
    totalCompleted: number;
    totalFailed: number;
}

export interface TrashItem {
    id: string;
    type: 'task' | 'habit' | 'challenge';
    data: Task | Habit | Challenge;
    deletedAt: string;
    expiresAt: string;
}

export interface DailyCheckResponse {
    assignments: ChallengeAssignment[];
    weekPool: WeeklyChallengePool | null;
}

export interface SwapTodayResponse {
    id: string;
    challengeId: string;
    date: string;
    status: 'active';
}
