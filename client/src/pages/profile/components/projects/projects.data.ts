// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ProjectStatus = 'live' | 'wip' | 'archived';

export interface Project {
    id: string;
    title: string;
    description: string;
    tags: string[];
    status: ProjectStatus;
    year: string;
    wx: number;
    wy: number;
    wz: number;
    link?: string;
    github?: string;
    logo?: boolean;
    asciiPreview?: boolean;
    changelog?: { text: string; date: string }[];
}

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

export const PROJECTS: Project[] = [
    {
        id: '1',
        title: 'Форма входа',
        description:
            'Три режима в одном: вход, регистрация, восстановление пароля. Переходы между ними — плавные, без перезагрузки страницы.\n\nПароль хэшируется, токен хранится в httpOnly cookie — из JavaScript недоступен. Брутфорс ограничен: 10 попыток за 15 минут.',
        tags: ['React', 'TypeScript', 'Express', 'SQLite'],
        status: 'live',
        year: '2024',
        wx: 0,
        wy: 0,
        wz: 0,
        link: '/login',
        asciiPreview: true,
    },
    {
        id: '2',
        title: 'Моя страница',
        description:
            'Портфолио с 3D-сценой на Three.js, WebGL-волнами, scroll-анимациями на Framer Motion и Canvas 2D.\nПостоянно дорабатываю.',
        tags: ['React', 'Three.js', 'WebGL', 'Canvas'],
        status: 'wip',
        year: 'декабрь 2025 - ...',
        wx: -320,
        wy: 90,
        wz: -1500,
        logo: true,
        changelog: [
            // CHANGELOG_INSERT
            { text: 'add productivity hub with tasks, habits, challenges, trash', date: '16 апр' },
            { text: 'use post-commit + amend, env guard prevents recursion', date: '2 апр' },
            { text: 'use cwd in git add so staged file lands in commit', date: '2 апр' },
            { text: 'limit to 10 entries, trim oldest on overflow', date: '2 апр' },
            { text: 'use prepare-commit-msg hook so file lands in same commit', date: '2 апр' },
            { text: 'stop hint cycle on interaction, restart on mouse leave', date: '2 апр' },
            {
            { text: 'NiAz title + az.svg favicon', date: '2 апр' },
            { text: 'build date auto-injection via Vite define', date: '2 апр' },
            { text: 'companion: drag hint icon + 100×100 on mobile', date: '2 апр' },
],
    },
    {
        id: '3',
        title: 'Дашборд пользователя',
        description:
            'Персональный productivity-хаб. Задачи с разделами и дедлайнами, трекер привычек с SVG-визуализацией, ежедневные челленджи из недельного пула, корзина с восстановлением.',
        tags: ['React', 'TypeScript', 'SQLite', 'WebGL'],
        status: 'wip',
        year: 'апрель 2026 - ...',
        wx: 280,
        wy: -70,
        wz: -3000,
    },
];
