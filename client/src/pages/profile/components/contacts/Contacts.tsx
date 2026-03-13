import { useEffect, useRef } from 'react';
import snowImg from '@/assets/Snow1.png';
import './contacts.css';

const CONTACTS = [
    { label: 'Email', value: 'niyaz@example.com', href: 'mailto:niyaz@example.com' },
    { label: 'GitHub', value: 'github.com/niyaz', href: 'https://github.com/niyaz' },
    { label: 'Telegram', value: '@niyaz', href: 'https://t.me/niyaz' },
];

export const Contacts = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        const img = imgRef.current;
        if (!section || !img) return;

        const update = () => {
            const rect = section.getBoundingClientRect();
            const vh = window.innerHeight;

            // 0 = секция ниже вьюпорта, 1 = секция полностью видна
            const progress = (vh + rect.height - rect.bottom) / rect.height;
            const clamped = Math.max(0, Math.min(1, progress));

            // Параллакс: изображение начинает снизу (+380px) и плывёт к 0
            const translateY = 380 * (1 - clamped);
            // Плавное появление: opacity 0 → 1 в первой половине прокрутки
            const opacity = Math.min(1, clamped * 2);

            img.style.transform = `translateX(-50%) translateY(${translateY.toFixed(1)}px)`;
            img.style.opacity = opacity.toFixed(3);
        };

        window.addEventListener('scroll', update, { passive: true });
        update();
        return () => window.removeEventListener('scroll', update);
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
