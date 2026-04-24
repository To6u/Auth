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
            { text: 'синхронизация radius-токенов — xs/chip/input/pill/card-lg/challenge-card', date: '24 апр' },
            { text: 'полная токенизация border-radius — xs/chip/sm/input/md/lg/xl/pill/card-lg/challenge-card/full', date: '24 апр' },
            { text: 'правки по ревью дизайн-системы — corner-shape глобально, font-weight 200, text-shadow заголовки, transitions токены', date: '24 апр' },
            { text: 'унификация font-weight по дизайн-системе 900/500/400/300/200, text-shadow на section titles', date: '24 апр' },
            { text: 'living style guide — секция tokens, corner-shape, синхронизация radius/colors', date: '24 апр' },
            { text: 'radius и transitions токены в дизайн-систему', date: '24 апр' },
            { text: 'svg-иконки из Figma экспорта', date: '23 апр' },
            { text: 'inline-редактирование задач, архив, напоминания, повторения', date: '23 апр' },
            { text: 'унификация scrollbar, squircle на daily-challenge', date: '23 апр' },
            { text: 'убрать hint-мигалку, a11y role и cursor на CSS :hover', date: '23 апр' },
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
