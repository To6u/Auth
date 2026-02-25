import { useState, useEffect, useCallback } from 'react';
import './header.css';

const NAV_ITEMS = [
    { id: 'deer', label: 'De|eR' },
    { id: 'place', label: 'Откуда' },
    { id: 'way', label: 'Путь' },
    { id: 'projects', label: 'Проекты' },
    { id: 'contacts', label: 'Связь' },
] as const;

type SectionId = (typeof NAV_ITEMS)[number]['id'];

const Header = () => {
    const [activeId, setActiveId] = useState<SectionId | null>(null);

    const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveId(visible.target.id as SectionId);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(handleIntersect, {
            threshold: 0.3,
        });

        NAV_ITEMS.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [handleIntersect]);

    return (
        <ul className="header">
            {NAV_ITEMS.map(({ id, label }) => (
                <li key={id}>
                    <a href={`#${id}`} className={activeId === id ? 'header__link--active' : undefined}>
                        {label}
                    </a>
                </li>
            ))}
        </ul>
    );
};

export default Header;
