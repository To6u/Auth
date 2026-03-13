import { useState, useEffect } from 'react';
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

    useEffect(() => {
        // IntersectionObserver не подходит для секций разной высоты:
        // threshold: 0.3 на #projects (650vh) требует 195vh видимости — никогда не выполнится.
        // Scroll-подход: ищем самую нижнюю секцию, чей top прошёл середину viewport.
        const getActive = (): SectionId | null => {
            const mid = window.scrollY + window.innerHeight * 0.5;
            for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
                const el = document.getElementById(NAV_ITEMS[i]!.id);
                if (!el) continue;
                const top = el.getBoundingClientRect().top + window.scrollY;
                if (mid >= top) return NAV_ITEMS[i]!.id;
            }
            return null;
        };

        const onScroll = () => setActiveId(getActive());
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

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
