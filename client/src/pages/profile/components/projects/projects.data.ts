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
            { text: 'добавить typecheck скрипт для выравнивания с Cloudflare build', date: '28 апр' },
            { text: 'исправить ошибки tsc -b для Cloudflare Pages', date: '28 апр' },
            { text: 'добавить demo mode для Cloudflare Pages', date: '28 апр' },
            { text: 'исправить хук — brace-tracking вместо построчного фильтра, восстановить записи', date: '28 апр' },
            { text: 'восстановить changelog после повреждения хуком', date: '28 апр' },
            {
                text: 'добавить ссылку на дашборд в шапку и исправить редирект при логауте',
                date: '27 апр',
            },
            { text: 'удалить мёртвый код и исправить a11y', date: '27 апр' },
            { text: 'NavigationDirectionContext + переработка анимаций переходов', date: '27 апр' },
            { text: 'разрешить swap failed-челленджей внутри недели', date: '27 апр' },
            { text: 'отключить лимиты запросов в dev-режиме', date: '27 апр' },
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
        link: '/dashboard',
    },
];
