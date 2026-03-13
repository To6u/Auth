import { useState, useEffect, useRef } from 'react';
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
    // Кешированные позиции секций — пересчитываются только при resize, не в scroll hot path
    const topsRef = useRef<number[]>([]);

    useEffect(() => {
        // IntersectionObserver не подходит для секций разной высоты:
        // threshold: 0.3 на #projects (650vh) требует 195vh видимости — никогда не выполнится.
        // Scroll-подход: ищем самую нижнюю секцию, чей top прошёл середину viewport.
        const cacheTops = () => {
            topsRef.current = NAV_ITEMS.map(({ id }) => {
                const el = document.getElementById(id);
                return el ? el.getBoundingClientRect().top + window.scrollY : 0;
            });
        };

        const getActive = (): SectionId | null => {
            const mid = window.scrollY + window.innerHeight * 0.5;
            for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
                if (mid >= topsRef.current[i]!) return NAV_ITEMS[i]!.id;
            }
            return null;
        };

        cacheTops();
        const onScroll = () => setActiveId(getActive());
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', cacheTops, { passive: true });
        onScroll();
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', cacheTops);
        };
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
