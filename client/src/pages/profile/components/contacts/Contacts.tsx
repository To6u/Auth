import { useEffect, useRef } from 'react';
import azAscii from '@/assets/az_ascii.txt?raw';
import snowImg from '@/assets/Snow1.png';
import { ErrorBoundary } from '@/components/error-boundary/ErrorBoundary.tsx';
import { useAnimationMode } from '@/context/AnimationModeContext';
import { AsciiArt } from './AsciiArt.tsx';
import AsciiRain from './AsciiRain.tsx';
import './contacts.css';

// ── Иконки ──────────────────────────────────────────────────────────────────

const TelegramIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
);

const InstagramIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
);

const EmailIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <polyline points="2,4 12,13 22,4" />
    </svg>
);

// ── Конфиг карточек ──────────────────────────────────────────────────────────

const SOCIAL_CARDS = [
    {
        id: 'telegram',
        label: 'Telegram',
        handle: '@AZmagulovNI',
        href: 'https://t.me/AZmagulovNI',
        Icon: TelegramIcon,
        color: 'rgba(41, 182, 246, 0.85)',
    },
    {
        id: 'instagram',
        label: 'Instagram',
        handle: '@o_upsssss',
        href: 'https://instagram.com/o_upsssss',
        Icon: InstagramIcon,
        color: 'rgba(225, 100, 150, 0.85)',
    },
    {
        id: 'email',
        label: 'Email',
        handle: 'azmagulov@gmail.com',
        href: 'mailto:nazmagulov@gmail.com',
        Icon: EmailIcon,
        color: 'rgba(165, 180, 252, 0.85)',
    },
] as const;

// ── Хук 3D-наклона карточки при наведении ───────────────────────────────────

const MAX_TILT = 15; // deg

function useCardTilt() {
    const ref = useRef<HTMLAnchorElement>(null);
    const { isSavingMode } = useAnimationMode();
    const isSavingModeRef = useRef(isSavingMode);
    isSavingModeRef.current = isSavingMode;

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const onMove = (e: MouseEvent) => {
            if (isSavingModeRef.current) return;
            const rect = el.getBoundingClientRect();
            // Нормализованная позиция -1..1 внутри карточки
            const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            el.style.transform = [
                'perspective(600px)',
                `rotateX(${(-ny * MAX_TILT).toFixed(2)}deg)`,
                `rotateY(${(nx * MAX_TILT).toFixed(2)}deg)`,
                'scale(1.04)',
            ].join(' ');
        };

        const onLeave = () => {
            el.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)';
        };

        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseleave', onLeave);
        return () => {
            el.removeEventListener('mousemove', onMove);
            el.removeEventListener('mouseleave', onLeave);
        };
    }, []);

    return ref;
}

// ── Карточка ─────────────────────────────────────────────────────────────────

type CardProps = (typeof SOCIAL_CARDS)[number];

const SocialCard = ({ label, handle, href }: Omit<CardProps, 'Icon' | 'color'>) => {
    const ref = useCardTilt();

    return (
        <a
            ref={ref}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="contacts-card"
        >
            <span className="contacts-card__label">{label}</span>
            <span className="contacts-card__handle">{handle}</span>
        </a>
    );
};

// ── Lerp-параметры фонового изображения ─────────────────────────────────────

const MOUSE_LERP = 0.06;
const BG_TILT_X = 8;
const BG_TILT_Y = 12;
const BG_PARALLAX_X = 20;

// ── Компонент ────────────────────────────────────────────────────────────────

export const Contacts = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const { isSavingMode: _savingMode } = useAnimationMode();
    const isSavingModeRef = useRef(_savingMode);
    isSavingModeRef.current = _savingMode;

    useEffect(() => {
        const section = sectionRef.current;
        const img = imgRef.current;
        if (!section || !img) return;

        let scrollTranslateY = 380;
        let bgOpacity = 0;
        let rawMouseX = 0;
        let rawMouseY = 0;
        let smoothMouseX = 0;
        let smoothMouseY = 0;
        let rafId = 0;
        let cancelled = false;

        let sectionTop = section.getBoundingClientRect().top + window.scrollY;
        let sectionHeight = section.offsetHeight;

        const recalcLayout = () => {
            sectionTop = section.getBoundingClientRect().top + window.scrollY;
            sectionHeight = section.offsetHeight;
        };

        const onScroll = () => {
            const scrolled = window.scrollY - sectionTop + window.innerHeight;
            const progress = scrolled / sectionHeight;
            const clamped = Math.max(0, Math.min(1, progress));
            scrollTranslateY = 380 * (1 - clamped);
            bgOpacity = Math.min(1, clamped * 2);
            lastActivityTime = performance.now();
            if (!rafId && isVisible && !cancelled) rafId = requestAnimationFrame(tick);
        };

        const onMouseMove = (e: MouseEvent) => {
            if (isSavingModeRef.current) return;
            lastActivityTime = performance.now();
            if (!rafId && isVisible && !cancelled) rafId = requestAnimationFrame(tick);
            // Нижняя часть экрана не влияет на параллакс — smootherstep [0.3→0.7]
            const yRatio = e.clientY / window.innerHeight;
            const t = Math.max(0, Math.min(1, (yRatio - 0.4) / 0.4));
            const yFactor = 1 - t * t * t * (t * (t * 6 - 15) + 10);
            rawMouseX = (e.clientX / window.innerWidth - 0.5) * 2 * yFactor;
            rawMouseY = (yRatio - 0.5) * 2 * yFactor;
        };

        const IDLE_TIMEOUT_CONTACTS = 5_000;
        let lastActivityTime = performance.now();
        let isVisible = false;

        const tick = () => {
            if (cancelled) return;
            if (performance.now() - lastActivityTime > IDLE_TIMEOUT_CONTACTS) {
                rafId = 0;
                return;
            }
            smoothMouseX += (rawMouseX - smoothMouseX) * MOUSE_LERP;
            smoothMouseY += (rawMouseY - smoothMouseY) * MOUSE_LERP;

            const tiltY = smoothMouseX * BG_TILT_Y;
            const tiltX = smoothMouseY * -BG_TILT_X;
            const offsetX = smoothMouseX * BG_PARALLAX_X;

            img.style.transform = [
                `translateX(calc(-50% + ${offsetX.toFixed(2)}px))`,
                `translateY(${scrollTranslateY.toFixed(2)}px)`,
                `perspective(800px)`,
                `rotateX(${tiltX.toFixed(3)}deg)`,
                `rotateY(${tiltY.toFixed(3)}deg)`,
            ].join(' ');
            img.style.opacity = bgOpacity.toFixed(3);

            rafId = requestAnimationFrame(tick);
        };

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                isVisible = entry.isIntersecting;
                if (isVisible) {
                    lastActivityTime = performance.now();
                    if (!rafId && !cancelled) rafId = requestAnimationFrame(tick);
                } else {
                    cancelAnimationFrame(rafId);
                    rafId = 0;
                }
            },
            { rootMargin: '100px' }
        );

        onScroll();
        intersectionObserver.observe(section);
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('resize', recalcLayout, { passive: true });

        return () => {
            cancelled = true;
            cancelAnimationFrame(rafId);
            intersectionObserver.disconnect();
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', recalcLayout);
        };
    }, []);

    return (
        <section id="contacts" ref={sectionRef} className="contacts-section">
            <div className="contacts-bg" aria-hidden="true">
                <div className="contacts-aurora">
                    <div className="contacts-aurora__blob contacts-aurora__blob--1" />
                    <div className="contacts-aurora__blob contacts-aurora__blob--2" />
                    <div className="contacts-aurora__blob contacts-aurora__blob--3" />
                    <div className="contacts-aurora__blob contacts-aurora__blob--4" />
                    <div className="contacts-aurora__blob contacts-aurora__blob--5" />
                </div>
                <img ref={imgRef} src={snowImg} alt="" className="contacts-bg-img" />
            </div>

            <div className="contacts-inner">
                <h2 className="contacts-heading">Связь</h2>
                <div className="contacts-cards">
                    {SOCIAL_CARDS.map((card) => (
                        <SocialCard key={card.id} {...card} />
                    ))}
                </div>
            </div>

            <ErrorBoundary fallback={null} name="AsciiRain">
                <AsciiRain />
            </ErrorBoundary>

            <AsciiArt
                className="companion-group__ascii"
                text={azAscii
                    .split('\n')
                    .slice(0, 17)
                    .map((l) => l.trimEnd())
                    .join('\n')}
            />
        </section>
    );
};

export default Contacts;
