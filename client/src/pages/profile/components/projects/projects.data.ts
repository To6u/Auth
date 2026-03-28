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
            { text: 'expandable cards with inner scroll + 0.8s bottom lock', date: '24 мар' },
            { text: 'header dims to 0.3 inside projects section', date: '24 мар' },
            { text: 'global macOS-style scrollbar', date: '18 мар' },
            { text: 'scroll-driven 3D camera path via Catmull-Rom spline', date: '18 мар' },
            { text: 'WebGL wave — phase accumulator, no time jump on resume', date: '14 мар' },
            {
                text: 'MobilePhotoStrip — infinite carousel, directional slide',
                date: '10 мар',
            },
        ],
    },
    {
        id: '3',
        title: 'Дашборд пользователя',
        description:
            'Личное пространство для задач и привычек. Список дел с приоритетами и дедлайнами, трекер привычек с визуализацией прогресса.',
        tags: ['React', 'TypeScript', 'SQLite'],
        status: 'archived',
        year: 'апрель 2026',
        wx: 280,
        wy: -70,
        wz: -3000,
    },
];
