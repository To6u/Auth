import { useEffect, useRef } from 'react';
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
        handle: '@niyaz',
        href: 'https://t.me/niyaz',
        Icon: TelegramIcon,
        color: 'rgba(41, 182, 246, 0.85)',
    },
    {
        id: 'instagram',
        label: 'Instagram',
        handle: '@niyaz',
        href: 'https://instagram.com/niyaz',
        Icon: InstagramIcon,
        color: 'rgba(225, 100, 150, 0.85)',
    },
    {
        id: 'email',
        label: 'Email',
        handle: 'niyaz@example.com',
        href: 'mailto:niyaz@example.com',
        Icon: EmailIcon,
        color: 'rgba(165, 180, 252, 0.85)',
    },
] as const;

// ── Хук 3D-наклона карточки при наведении ───────────────────────────────────

const MAX_TILT = 15; // deg

function useCardTilt() {
    const ref = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const onMove = (e: MouseEvent) => {
            const rect = el.getBoundingClientRect();
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

const SocialCard = ({ label, handle, href, Icon, color }: CardProps) => {
    const ref = useCardTilt();

    return (
        <a
            ref={ref}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="contacts-card"
        >
            <span className="contacts-card__icon" style={{ color }}>
                <Icon />
            </span>
            <span className="contacts-card__label">{label}</span>
            <span className="contacts-card__handle">{handle}</span>
        </a>
    );
};

// ── Компонент ────────────────────────────────────────────────────────────────

export const Contacts = () => {
    return (
        <section id="contacts" className="contacts-section">
            <div className="contacts-aurora" aria-hidden="true">
                <div className="contacts-aurora__blob contacts-aurora__blob--1" />
                <div className="contacts-aurora__blob contacts-aurora__blob--2" />
                <div className="contacts-aurora__blob contacts-aurora__blob--3" />
                <div className="contacts-aurora__blob contacts-aurora__blob--4" />
                <div className="contacts-aurora__blob contacts-aurora__blob--5" />
            </div>

            <div className="contacts-inner">
                <h2 className="contacts-heading">Соц сети</h2>
                <div className="contacts-cards">
                    {SOCIAL_CARDS.map((card) => (
                        <SocialCard key={card.id} {...card} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Contacts;
