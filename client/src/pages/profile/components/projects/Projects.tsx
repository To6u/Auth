import { ArrowDown, ExternalLink, Github, X } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/auth-form/components/Logo/Logo';
import { SubmitButton } from '@/components/auth-form/components/SubmitButton/SubmitButton';
import { LoginAsciiPreview } from '@/components/login-ascii-preview/LoginAsciiPreview';
import { projectsState } from '@/lib/projectsState';
import './Projects.css';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ProjectStatus = 'live' | 'wip' | 'archived';

interface Project {
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
// Datav
// ─────────────────────────────────────────────────────────────

const PROJECTS: Project[] = [
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

// ─────────────────────────────────────────────────────────────
// Camera spline helpers
// ─────────────────────────────────────────────────────────────

interface Vec3 {
    x: number;
    y: number;
    z: number;
}

/**
 * Camera waypoints.
 * Z grows positively as the "virtual camera" flies forward;
 * the world transform inverts it so cards approach the viewer.
 */
const CAM_PATH: Vec3[] = [
    { x: 0, y: 0, z: 0 }, // card-0
    { x: -320, y: 90, z: 1500 }, // card-1
    { x: 280, y: -70, z: 3000 }, // card-2
    { x: 280, y: -70, z: 3000 }, // ease-out tail — stops at card-2
];

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
        0.5 *
        (2 * p1 +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
    );
}

/**
 * Map t ∈ [0, 1] to a position on the Catmull-Rom spline defined by `path`.
 * Boundary condition: duplicates start/end points to prevent NaN at edges.
 */
function splinePoint(path: Vec3[], t: number): Vec3 {
    const n = path.length - 1; // segment count
    const clamped = Math.min(Math.max(t, 0), 1);
    const raw = clamped * n;
    const i = Math.min(Math.floor(raw), n - 1);
    const localT = raw - i;

    // Duplicate boundary points to satisfy Catmull-Rom requirements.
    // Non-null assertions are safe: indices are clamped to [0, n] above.
    const p0 = path[i === 0 ? 0 : i - 1]!;
    const p1 = path[i]!;
    const p2 = path[i + 1]!;
    const p3 = path[i >= n - 1 ? n : i + 2]!;

    return {
        x: catmullRom(p0.x, p1.x, p2.x, p3.x, localT),
        y: catmullRom(p0.y, p1.y, p2.y, p3.y, localT),
        z: catmullRom(p0.z, p1.z, p2.z, p3.z, localT),
    };
}

function clamp(v: number, lo: number, hi: number): number {
    return Math.min(Math.max(v, lo), hi);
}

// ─────────────────────────────────────────────────────────────
// ProjectCard — pure display, no scroll logic
// ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ProjectStatus, string> = {
    live: 'Онлайн',
    wip: 'В работе',
    archived: 'В планах',
};

interface ProjectCardProps {
    data: Project;
}

const ProjectCard = memo(({ data }: ProjectCardProps) => (
    /*
     * backdrop-filter is intentionally on .projects-scene__card-body,
     * NOT on the parent .projects-scene__card which carries preserve-3d.
     * Applying backdrop-filter directly on a preserve-3d child breaks
     * 3D compositing in WebKit/Safari (unresolved engine bug).
     *
     * .projects-scene__card-scroll is the inner scroll wrapper — it carries
     * padding/flex and gets overflow-y:auto in expanded state. The parent
     * card-body stays overflow:hidden to clip the scrollbar to border-radius.
     */
    <div className="projects-scene__card-body">
        <div className="projects-scene__card-scroll">
            <div className="projects-scene__card-header">
                <span className={`projects-scene__badge projects-scene__badge--${data.status}`}>
                    {STATUS_LABELS[data.status]}
                </span>
                <span className="projects-scene__year">{data.year}</span>
            </div>

            <div className="projects-scene__card-main-content">
                <div className="projects-scene__card-text">
                    <h3 className="projects-scene__card-title">{data.title}</h3>
                    <p className="projects-scene__card-desc">{data.description}</p>
                </div>
                {(data.logo || data.asciiPreview) && (
                    <div className="projects-scene__card-image">
                        {data.logo && <Logo />}
                        {data.asciiPreview && <LoginAsciiPreview />}
                    </div>
                )}
            </div>

            <div className="projects-scene__tags">
                {data.tags.map((tag) => (
                    <span key={tag} className="projects-scene__tag">
                        {tag}
                    </span>
                ))}
            </div>

            {data.changelog && data.changelog.length > 0 && (
                <div className="projects-scene__changelog">
                    <span className="projects-scene__changelog-title">Последние изменения:</span>
                    <ul className="projects-scene__changelog-list">
                        {data.changelog.map((entry) => (
                            <li key={entry.text}>
                                <span className="projects-scene__changelog-date">{entry.date}</span>
                                {entry.text}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {(data.link ?? data.github) && (
                <div className="projects-scene__links">
                    {data.link && (
                        <a
                            href={data.link}
                            className="projects-scene__link"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink size={14} />
                            <span>Посмотреть в живую</span>
                        </a>
                    )}
                    {data.github && (
                        <a
                            href={data.github}
                            className="projects-scene__link"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Github size={14} />
                            <span>GitHub</span>
                        </a>
                    )}
                </div>
            )}
        </div>
    </div>
));

ProjectCard.displayName = 'ProjectCard';

// ─────────────────────────────────────────────────────────────
// Projects — main component
// ─────────────────────────────────────────────────────────────

// Progress values on the spline where each card is centred (matches CAM_PATH indices 0, 1, 2 of 3)
const CARD_PROGRESS = [0, 1 / 3, 2 / 3] as const;

export const Projects = () => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const sectionRef = useRef<HTMLElement>(null);
    const worldRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const navRef = useRef<HTMLElement>(null);
    const navDotRefs = useRef<(HTMLDivElement | null)[]>([]);
    const labelRef = useRef<HTMLDivElement>(null);
    const counterRef = useRef<HTMLDivElement>(null);
    const counterCurRef = useRef<HTMLSpanElement>(null);
    const scrollHintRef = useRef<HTMLDivElement>(null);
    // Shared state for click handler (no React state — avoids re-renders)
    const activeIndexRef = useRef(0);
    const touchMovedRef = useRef(false);
    const sectionTopRef = useRef(0);
    const sectionScrollableRef = useRef(0);
    const pendingExpandRef = useRef<string | null>(null);

    useEffect(() => {
        const section = sectionRef.current;
        const world = worldRef.current;
        if (!section || !world) return;

        // Narrow types for inner functions — refs are stable after guard
        const sectionEl: HTMLElement = section;
        const worldEl: HTMLDivElement = world;

        let sectionTop = section.getBoundingClientRect().top + window.scrollY;
        let sectionScrollable = section.offsetHeight - window.innerHeight;
        let xScale = Math.min(1, window.innerWidth / 1200);
        sectionTopRef.current = sectionTop;
        sectionScrollableRef.current = sectionScrollable;

        function applyCardPositions(): void {
            PROJECTS.forEach((p, i) => {
                const el = cardRefs.current[i];
                if (!el) return;
                el.style.transform = `translateX(calc(-50% + ${p.wx * xScale}px)) translateY(calc(-50% + ${p.wy}px)) translateZ(${p.wz}px)`;
            });
        }

        const recalcLayout = () => {
            sectionTop = section.getBoundingClientRect().top + window.scrollY;
            sectionScrollable = section.offsetHeight - window.innerHeight;
            xScale = Math.min(1, window.innerWidth / 1200);
            sectionTopRef.current = sectionTop;
            sectionScrollableRef.current = sectionScrollable;
            applyCardPositions();
        };

        window.addEventListener('resize', recalcLayout, { passive: true });

        const bodyResizeObserver = new ResizeObserver(() => {
            recalcLayout();
        });
        bodyResizeObserver.observe(sectionEl);
        bodyResizeObserver.observe(document.body);

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // ── Mutable camera state (never in React state — lives in rAF) ──
        let camX = 0;
        let camY = 0;
        let camZ = 0;
        let tCamX = 0;
        let tCamY = 0;
        let tCamZ = 0;
        let rafId = 0;
        let lastActiveIndex = -1;
        let scrollTimer: ReturnType<typeof setTimeout> | undefined;
        // Кэш .projects-scene__card-body элементов — избегаем querySelector в каждом кадре
        const cardBodyEls: (HTMLElement | null)[] = [];
        let lastScrollY = window.scrollY;

        const LERP = 0.09;
        const THRESHOLD = 0.1;
        // Задержка сброса isScrolling — достаточно чтобы покрыть инерцию тачпада (~2-3 кадра)
        const SCROLL_IDLE_MS = 150;

        // ── Scroll progress ──────────────────────────────────────────────
        function getProgress(): number {
            return clamp((window.scrollY - sectionTop) / sectionScrollable, 0, 1);
        }

        // ── Nav / UI overlay visibility ──────────────────────────────────
        let lastInView: boolean | null = null;
        let lastNavInView: boolean | null = null;

        function syncVisibility(): void {
            const scrollY = window.scrollY;
            const inView =
                scrollY + window.innerHeight > sectionTop &&
                scrollY < sectionTop + sectionEl.offsetHeight;
            // Nav-точки видны только когда пользователь реально внутри секции
            const progress = getProgress();
            const navInView = progress > 0.01 && progress < 0.999;

            if (inView !== lastInView) {
                lastInView = inView;
                labelRef.current?.classList.toggle('visible', inView);
                counterRef.current?.classList.toggle('visible', inView);
                scrollHintRef.current?.classList.toggle('visible', inView);
            }

            if (navInView !== lastNavInView) {
                lastNavInView = navInView;
                navRef.current?.classList.toggle('visible', navInView);
            }
        }

        // ── Per-card depth effect ────────────────────────────────────────
        function updateCards(): void {
            let minAbsZ = Infinity;
            let activeIndex = 0;
            const opacities: number[] = [];

            PROJECTS.forEach((p, i) => {
                const el = cardRefs.current[i];
                if (!el) return;

                // Positive effectiveZ → card is behind the camera (flew past).
                // Zero              → card is exactly at camera plane.
                // Negative          → card is ahead of the camera.
                const effectiveZ = p.wz + camZ;

                let opacity: number;
                let blurPx: number;

                if (effectiveZ > 600) {
                    // Fully gone
                    opacity = 0;
                    blurPx = 0;
                } else if (effectiveZ > 300) {
                    // Fading out — flew past
                    const t = (effectiveZ - 300) / 300; // 0 → 1
                    opacity = 1 - t;
                    blurPx = t * 2;
                } else if (effectiveZ > -300) {
                    // Focus zone
                    opacity = 1;
                    blurPx = 0;
                } else if (effectiveZ > -900) {
                    // Approaching / receding
                    const tDepth = (effectiveZ + 300) / -600; // 0 → 1
                    opacity = 1 - tDepth * 0.6; // 1 → 0.4
                    blurPx = tDepth * 2.5;
                } else {
                    // Very far
                    opacity = 0.2;
                    blurPx = 3;
                }

                opacities[i] = opacity;
                el.style.opacity = String(opacity);
                el.style.filter = blurPx > 0 ? `blur(${Math.round(blurPx)}px)` : 'none';

                // Клики только у карточек, которые ещё не прошли за камеру (effectiveZ < 300).
                // Карточки с effectiveZ ≥ 300 фейдятся позади камеры — несмотря на opacity > 0,
                // их projected 2D hit-area перехватывает клики предназначенные следующей карточке.
                const clickable = effectiveZ < 300 && opacity > 0.15;
                el.style.pointerEvents = clickable ? 'auto' : 'none';
                el.style.cursor = clickable ? 'pointer' : 'default';

                const absZ = Math.abs(effectiveZ);
                if (absZ < minAbsZ) {
                    minAbsZ = absZ;
                    activeIndex = i;
                }
            });

            // Зелёный outline — только когда карточка в фокусной зоне (opacity ≥ 0.9).
            // Без этого outline появляется пока карточка ещё в approaching-зоне и не кликабельна.
            // cardBodyEls кэшируется — querySelector не вызывается в каждом кадре.
            cardRefs.current.forEach((el, i) => {
                if (!el) return;
                if (!cardBodyEls[i]) {
                    cardBodyEls[i] = el.querySelector<HTMLElement>('.projects-scene__card-body');
                }
                const body = cardBodyEls[i];
                if (body) {
                    const inFocus = i === activeIndex && (opacities[i] ?? 0) >= 0.9;
                    body.style.boxShadow = inFocus
                        ? '0 0 0 3px rgba(74, 222, 128, 0.5)'
                        : '0 0 0 0 rgba(74, 222, 128, 0)';
                }
            });

            // Counter + nav dots — только при смене активной карточки
            if (activeIndex !== lastActiveIndex) {
                lastActiveIndex = activeIndex;
                activeIndexRef.current = activeIndex;

                if (counterCurRef.current) {
                    counterCurRef.current.textContent = String(activeIndex + 1).padStart(2, '0');
                }

                navDotRefs.current.forEach((dot, i) => {
                    dot?.classList.toggle('active', i === activeIndex);
                });
            }
        }

        // ── rAF tick ─────────────────────────────────────────────────────
        function tick(): void {
            const progress = getProgress();
            const target = splinePoint(CAM_PATH, progress);
            tCamX = target.x * xScale;
            tCamY = target.y;
            tCamZ = target.z;

            if (reducedMotion) {
                // Snap — no interpolation
                camX = tCamX;
                camY = tCamY;
                camZ = tCamZ;
            } else {
                camX += (tCamX - camX) * LERP;
                camY += (tCamY - camY) * LERP;
                camZ += (tCamZ - camZ) * LERP;
            }

            projectsState.camX = camX;
            projectsState.camY = camY;

            // Inverted camera → move world in opposite direction
            worldEl.style.transform = `translateX(${-camX}px) translateY(${-camY}px) translateZ(${camZ}px)`;

            updateCards();
            syncVisibility();

            // Loop until settled (reduced-motion: single tick per scroll event)
            if (!reducedMotion) {
                const unsettled =
                    Math.abs(tCamX - camX) > THRESHOLD ||
                    Math.abs(tCamY - camY) > THRESHOLD ||
                    Math.abs(tCamZ - camZ) > THRESHOLD;

                if (unsettled) {
                    rafId = requestAnimationFrame(tick);
                }
            }
        }

        // ── Scroll handler ───────────────────────────────────────────────
        function onScroll(): void {
            const currentScrollY = window.scrollY;
            const scrollingUp = currentScrollY < lastScrollY;
            lastScrollY = currentScrollY;

            scrollHintRef.current?.classList.toggle('projects-scene__scroll-hint--up', scrollingUp);

            const progress = getProgress();
            projectsState.camProgress = progress;
            projectsState.active = progress > 0.01 && progress < 0.999;
            projectsState.isScrolling = true;
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                projectsState.isScrolling = false;

                if (pendingExpandRef.current) {
                    setExpandedId(pendingExpandRef.current);
                    pendingExpandRef.current = null;
                }
            }, SCROLL_IDLE_MS);
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(tick);
        }

        window.addEventListener('scroll', onScroll, { passive: true });

        const onVisibilityChange = () => {
            if (document.hidden) {
                cancelAnimationFrame(rafId);
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        // Bootstrap: расставляем карточки с учётом xScale до первого скролла
        applyCardPositions();
        rafId = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', recalcLayout);
            bodyResizeObserver.disconnect();
            cancelAnimationFrame(rafId);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            projectsState.camProgress = 0;
            projectsState.active = false;
            projectsState.isScrolling = false;
            clearTimeout(scrollTimer);
        };
    }, []);

    // Сбрасываем скролл и перехватываем wheel при открытии карточки.
    // Когда пользователь доскролил до дна — ждём 1с и переходим к следующей карточке.
    useEffect(() => {
        if (!expandedId) return;
        const expandedIndex = PROJECTS.findIndex((p) => p.id === expandedId);
        const cardEl = cardRefs.current[expandedIndex];
        if (!cardEl) return;

        const scrollEl = cardEl.querySelector<HTMLElement>('.projects-scene__card-scroll');
        if (!scrollEl) return;
        scrollEl.scrollTop = 0;

        // После 1с ожидания на дне — разблокируем скрол (window получает события нативно)
        let unlocked = false;
        let unlockTimer: ReturnType<typeof setTimeout> | undefined;

        const onWheel = (e: WheelEvent) => {
            // Задержка нужна только если карточка реально скроллится (есть что листать)
            const hasScroll = scrollEl.scrollHeight > scrollEl.clientHeight + 2;
            if (!hasScroll) return;

            const atBottom =
                scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 2;

            if (atBottom && e.deltaY > 0) {
                if (unlocked) return; // пропускаем — window scroll сработает нативно
                e.preventDefault();
                e.stopPropagation();

                if (unlockTimer !== undefined) return; // уже ждём
                unlockTimer = setTimeout(() => {
                    unlockTimer = undefined;
                    unlocked = true;
                }, 800);
            } else {
                // Прокрутка вверх или не на дне — сбрасываем задержку
                clearTimeout(unlockTimer);
                unlockTimer = undefined;
                unlocked = false;
            }
        };

        scrollEl.addEventListener('wheel', onWheel, { passive: false });

        // Touch — document capture level: перехватываем до 3D-сцены.
        // getBoundingClientRect корректно возвращает 2D-проекцию после transform,
        // поэтому hit-test работает правильно несмотря на 3D-позицию карточки.
        // scrollMode фиксируется один раз при первом значимом движении —
        // исключает прыжки контента при смене режима в середине жеста.
        let touchStartY = 0;
        let lastTouchY = 0;
        let touchInsideCard = false;
        let scrollMode: 'undecided' | 'card' | 'page' = 'undecided';

        const onTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            if (!touch) return;
            touchStartY = touch.clientY;
            lastTouchY = touch.clientY;
            touchMovedRef.current = false;
            scrollMode = 'undecided';

            const rect = cardEl.getBoundingClientRect();
            touchInsideCard =
                touch.clientX >= rect.left &&
                touch.clientX <= rect.right &&
                touch.clientY >= rect.top &&
                touch.clientY <= rect.bottom;
        };

        const onTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            if (!touch) return;

            const deltaY = touch.clientY - lastTouchY;
            const totalDelta = touch.clientY - touchStartY;
            if (Math.abs(totalDelta) > 5) touchMovedRef.current = true;

            if (!touchInsideCard) {
                lastTouchY = touch.clientY;
                return;
            }

            // Фиксируем режим один раз при первых 8px движения
            if (scrollMode === 'undecided' && Math.abs(totalDelta) > 8) {
                const hasScroll = scrollEl.scrollHeight > scrollEl.clientHeight + 2;
                const atTop = scrollEl.scrollTop <= 0;
                const atBottom =
                    scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 2;
                const swipingDown = totalDelta > 0; // палец вниз → контент вверх

                if (!hasScroll || (atTop && swipingDown) || (atBottom && !swipingDown)) {
                    scrollMode = 'page';
                } else {
                    scrollMode = 'card';
                }
            }

            lastTouchY = touch.clientY;

            if (scrollMode !== 'card') return;

            e.preventDefault();
            scrollEl.scrollTop -= deltaY;
        };

        const onTouchEnd = () => {
            touchInsideCard = false;
            scrollMode = 'undecided';
            setTimeout(() => {
                touchMovedRef.current = false;
            }, 50);
        };

        document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
        document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
        document.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });

        return () => {
            scrollEl.removeEventListener('wheel', onWheel);
            document.removeEventListener('touchstart', onTouchStart, { capture: true });
            document.removeEventListener('touchmove', onTouchMove, { capture: true });
            document.removeEventListener('touchend', onTouchEnd, { capture: true });
            clearTimeout(unlockTimer);
        };
    }, [expandedId]);

    return (
        <>
            <section ref={sectionRef} id="projects" className="projects-scene">
                <div className="projects-scene__label" ref={labelRef}>
                    Проекты
                </div>

                <div className="projects-scene__sticky">
                    {/* Atmospheric overlays */}
                    <div className="projects-scene__fog-top" />
                    <div className="projects-scene__fog-bottom" />
                    <div className="projects-scene__vignette" />

                    {/* 3D world */}
                    <div className="projects-scene__world" ref={worldRef}>
                        {PROJECTS.map((p, i) => (
                            <div
                                key={p.id}
                                ref={(el) => {
                                    cardRefs.current[i] = el;
                                }}
                                className={`projects-scene__card${expandedId === p.id ? ' projects-scene__card--expanded' : ''}`}
                                onClick={() => {
                                    if (touchMovedRef.current) return;
                                    if (i === activeIndexRef.current) {
                                        setExpandedId((cur) => (cur === p.id ? null : p.id));
                                    } else {
                                        // Карточка не активна — плавно прокручиваем к её слою,
                                        // расширяем после остановки скролла
                                        const progress = CARD_PROGRESS[i] ?? 0;
                                        const targetY =
                                            sectionTopRef.current +
                                            progress * sectionScrollableRef.current;
                                        pendingExpandRef.current = p.id;
                                        window.scrollTo({ top: targetY, behavior: 'smooth' });
                                    }
                                }}
                            >
                                {/* Кнопка закрыть — внутри card, над card-body, управляется CSS через --expanded */}
                                <div
                                    className="projects-scene__close-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedId(null);
                                    }}
                                >
                                    <SubmitButton
                                        isLoading={false}
                                        buttonText=""
                                        type="button"
                                        icon={<X size={14} />}
                                        iconPosition="left"
                                        aria-label="Закрыть карточку"
                                        onClick={() => setExpandedId(null)}
                                    />
                                </div>
                                <ProjectCard data={p} />
                            </div>
                        ))}
                    </div>

                    {/* Counter */}
                    <div className="projects-scene__counter" ref={counterRef}>
                        <span ref={counterCurRef}>01</span>
                        <span> / {String(PROJECTS.length).padStart(2, '0')}</span>
                    </div>

                    {/* Scroll hint */}
                    <div className="projects-scene__scroll-hint" ref={scrollHintRef}>
                        <ArrowDown size={12} />
                        <span>Scroll</span>
                    </div>
                </div>
            </section>

            {/* Fixed nav dots — outside section so they overlay freely */}
            <nav className="projects-scene__nav" ref={navRef} aria-label="Projects navigation">
                {PROJECTS.map((p, i) => (
                    <div
                        key={p.id}
                        ref={(el) => {
                            navDotRefs.current[i] = el;
                        }}
                        className="projects-scene__nav-dot"
                        aria-label={`Project ${i + 1}`}
                    />
                ))}
            </nav>
        </>
    );
};

Projects.displayName = 'Projects';

export default Projects;
