import { useEffect, useRef } from 'react';
import snowImg from '@/assets/Snow1.png';
import './contacts.css';

const CONTACTS = [
    { label: 'Email', value: 'niyaz@example.com', href: 'mailto:niyaz@example.com' },
    { label: 'GitHub', value: 'github.com/niyaz', href: 'https://github.com/niyaz' },
    { label: 'Telegram', value: '@niyaz', href: 'https://t.me/niyaz' },
];

// Lerp-коэффициент сглаживания мыши — идентичен updateMouseState в wave-bg
const MOUSE_LERP = 0.06;
// Максимальный 3D-наклон (deg) — создаёт объёмность
const MAX_TILT_X = 8;
const MAX_TILT_Y = 12;
// Горизонтальное смещение вслед за мышью (px)
const MOUSE_PARALLAX_X = 20;

export const Contacts = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        const img = imgRef.current;
        if (!section || !img) return;

        // Скролл-параллакс (вход снизу)
        let scrollTranslateY = 380;
        let opacity = 0;

        // Мышиный параллакс — нормализованная позиция -1..1 от центра viewport
        let rawMouseX = 0;
        let rawMouseY = 0;
        let smoothMouseX = 0;
        let smoothMouseY = 0;
        let rafId = 0;
        let cancelled = false;

        const onScroll = () => {
            const rect = section.getBoundingClientRect();
            const vh = window.innerHeight;
            const progress = (vh + rect.height - rect.bottom) / rect.height;
            const clamped = Math.max(0, Math.min(1, progress));
            scrollTranslateY = 380 * (1 - clamped);
            opacity = Math.min(1, clamped * 2);
        };

        const onMouseMove = (e: MouseEvent) => {
            rawMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            rawMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        };

        const tick = () => {
            if (cancelled) return;

            smoothMouseX += (rawMouseX - smoothMouseX) * MOUSE_LERP;
            smoothMouseY += (rawMouseY - smoothMouseY) * MOUSE_LERP;

            // 3D-наклон: мышь вправо → правый край изображения уходит вперёд
            const tiltY = smoothMouseX * MAX_TILT_Y;
            // 3D-наклон: мышь вниз → нижний край уходит к зрителю
            const tiltX = smoothMouseY * -MAX_TILT_X;
            // Горизонтальное смещение вслед за мышью
            const offsetX = smoothMouseX * MOUSE_PARALLAX_X;

            img.style.transform = [
                `translateX(calc(-50% + ${offsetX.toFixed(2)}px))`,
                `translateY(${scrollTranslateY.toFixed(2)}px)`,
                `perspective(800px)`,
                `rotateX(${tiltX.toFixed(3)}deg)`,
                `rotateY(${tiltY.toFixed(3)}deg)`,
            ].join(' ');
            img.style.opacity = opacity.toFixed(3);

            rafId = requestAnimationFrame(tick);
        };

        onScroll();
        rafId = requestAnimationFrame(tick);

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('mousemove', onMouseMove, { passive: true });

        return () => {
            cancelled = true;
            cancelAnimationFrame(rafId);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('mousemove', onMouseMove);
        };
    }, []);

    return (
        <section id="contacts" ref={sectionRef} className="contacts-section">
            <img
                ref={imgRef}
                src={snowImg}
                alt=""
                aria-hidden="true"
                className="contacts-bg-img"
            />
            <div className="contacts-inner">
                <h2 className="contacts-heading">Контакты</h2>
                <ul className="contacts-list">
                    {CONTACTS.map(({ label, value, href }) => (
                        <li key={label} className="contacts-item">
                            <span className="contacts-item__label">{label}</span>
                            <a
                                className="contacts-item__link"
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {value}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};

export default Contacts;
