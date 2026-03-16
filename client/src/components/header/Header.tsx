import { useState, useEffect, useRef, useCallback } from 'react';
import './header.css';

const NAV_ITEMS = [
    { id: 'deer', label: 'De|eR' },
    { id: 'place', label: 'Откуда' },
    { id: 'way', label: 'Путь' },
    { id: 'projects', label: 'Проекты' },
    { id: 'contacts', label: 'СЦ' },
] as const;

type SectionId = (typeof NAV_ITEMS)[number]['id'];

const Header = () => {
    const [activeId, setActiveId] = useState<SectionId | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const topsRef = useRef<number[]>([]);
    const scrollYRef = useRef(0);

    useEffect(() => {
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

    // Блокируем скролл страницы когда меню открыто (включая iOS Safari)
    useEffect(() => {
        if (isOpen) {
            scrollYRef.current = window.scrollY;
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollYRef.current}px`;
            document.body.style.width = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo({ top: scrollYRef.current, behavior: 'instant' });
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
        };
    }, [isOpen]);

    const handleLinkClick = useCallback(() => setIsOpen(false), []);

    return (
        <>
            {/* Десктоп nav */}
            <ul className="header">
                {NAV_ITEMS.map(({ id, label }) => (
                    <li key={id}>
                        <a
                            href={`#${id}`}
                            className={activeId === id ? 'header__link--active' : undefined}
                        >
                            {label}
                        </a>
                    </li>
                ))}
            </ul>

            {/* Гамбургер кнопка — только на мобилке */}
            <button
                className={`header__burger${isOpen ? ' header__burger--open' : ''}`}
                onClick={() => setIsOpen(v => !v)}
                aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
                aria-expanded={isOpen}
            >
                <span /><span /><span />
            </button>

            {/* Мобильное меню */}
            <nav className={`header__mobile-menu${isOpen ? ' header__mobile-menu--open' : ''}`}>
                <ul>
                    {NAV_ITEMS.map(({ id, label }) => (
                        <li key={id}>
                            <a
                                href={`#${id}`}
                                className={activeId === id ? 'header__link--active' : undefined}
                                onClick={handleLinkClick}
                            >
                                {label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
};

export default Header;
