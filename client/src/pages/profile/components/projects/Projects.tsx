import { ArrowDown, ExternalLink, Github } from 'lucide-react';
import { memo, useEffect, useRef } from 'react';
import { Logo } from '@/components/auth-form/components/Logo/Logo';
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
}

// ─────────────────────────────────────────────────────────────
// Datav
// ─────────────────────────────────────────────────────────────

const PROJECTS: Project[] = [
    {
        id: '1',
        title: 'Форма входа',
        description:
            'Три режима — вход, регистрация, сброс пароля — в едином интерфейсе. Переключение между ними анимировано через Framer Motion с пружинной физикой. Валидация — real-time на blur, серверная через Zod.',
        tags: ['React', 'TypeScript', 'WebGL', 'D3.js'],
        status: 'live',
        year: '2024',
        wx: 0,
        wy: 0,
        wz: 0,
        link: '/login',
    },
    {
        id: '2',
        title: 'Моя страница',
        description: 'Пополняю, поддерживаю и улучшаю партфолио.',
        tags: ['React JS', 'WebGL', 'CSS 3D', 'Canvas'],
        status: 'wip',
        year: 'декабрь 2025 - ...',
        wx: -320,
        wy: 90,
        wz: -1500,
        logo: true,
    },
    {
        id: '3',
        title: 'Motion Design System',
        description:
            'Component library with scroll-driven animations, physics springs and GPU-accelerated transitions.',
        tags: ['React', 'Framer Motion', 'TypeScript'],
        status: 'archived',
        year: '2026',
        wx: 280,
        wy: -70,
        wz: -3000,
        github: '#',
    },
    {
        id: '4',
        title: 'Motion Design System',
        description:
            'Component library with scroll-driven animations, physics springs and GPU-accelerated transitions.',
        tags: ['React', 'Framer Motion', 'TypeScript'],
        status: 'archived',
        year: '2026',
        wx: -220,
        wy: 70,
        wz: -4500,
        github: '#',
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
    { x: 0, y: 0, z: 0 }, // start → card-0
    { x: -200, y: 60, z: 800 }, // sweep left
    { x: -320, y: 90, z: 1500 }, // arrive card-1
    { x: 80, y: 10, z: 2200 }, // sweep right
    { x: 280, y: -70, z: 3000 }, // arrive card-2
    { x: 20, y: -10, z: 3700 }, // sweep left → card-3
    { x: -220, y: 70, z: 4500 }, // arrive card-3
    { x: -220, y: 70, z: 4500 }, // ease-out tail — stops at card-3
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
     */
    <div className="projects-scene__card-body">
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
            <div className="projects-scene__card-image">{data.logo && <Logo />}</div>
        </div>

        <div className="projects-scene__tags">
            {data.tags.map((tag) => (
                <span key={tag} className="projects-scene__tag">
                    {tag}
                </span>
            ))}
        </div>

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
));

ProjectCard.displayName = 'ProjectCard';

// ─────────────────────────────────────────────────────────────
// Projects — main component
// ─────────────────────────────────────────────────────────────

export const Projects = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const worldRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const navRef = useRef<HTMLElement>(null);
    const navDotRefs = useRef<(HTMLDivElement | null)[]>([]);
    const labelRef = useRef<HTMLDivElement>(null);
    const counterRef = useRef<HTMLDivElement>(null);
    const counterCurRef = useRef<HTMLSpanElement>(null);
    const scrollHintRef = useRef<HTMLDivElement>(null);

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
            applyCardPositions();
        };

        window.addEventListener('resize', recalcLayout, { passive: true });

        const bodyResizeObserver = new ResizeObserver(() => {
            recalcLayout();
        });
        bodyResizeObserver.observe(sectionEl);

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

                el.style.opacity = String(opacity);
                el.style.filter = blurPx > 0 ? `blur(${blurPx.toFixed(2)}px)` : 'none';

                const absZ = Math.abs(effectiveZ);
                if (absZ < minAbsZ) {
                    minAbsZ = absZ;
                    activeIndex = i;
                }
            });

            // Counter + nav dots — only touch the DOM when index changes
            if (activeIndex !== lastActiveIndex) {
                lastActiveIndex = activeIndex;

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
            const progress = getProgress();
            projectsState.camProgress = progress;
            projectsState.active = progress > 0.01 && progress < 0.999;
            projectsState.isScrolling = true;
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                projectsState.isScrolling = false;
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
                                className="projects-scene__card"
                            >
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
