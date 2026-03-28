import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubmitButton } from '@/components/submit-button/SubmitButton';
import { LoginIcon, LogoutIcon } from '@/assets/icons';
import { useAnimationMode } from '@/context/AnimationModeContext';
import { useAuthInfo } from '@/hooks/useAuthInfo';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { ModeAlert } from '@/components/mode-alert/ModeAlert';
import { Companion } from '@/pages/profile/components/companion/Companion.tsx';
import './header.css';

const NAV_ITEMS = [
    { id: 'place', label: 'Откуда' },
    { id: 'way', label: 'Путь' },
    { id: 'projects', label: 'Проекты' },
    { id: 'contacts', label: 'Связь' },
] as const;

type SectionId = (typeof NAV_ITEMS)[number]['id'];

const LeafIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" width="24" height="24" aria-hidden="true">
        <path
            d="M3 13C3 13 5.5 6 13 3C13 9.5 8 13 3 13Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.25"
        />
        <path d="M3 13L7.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
);

// Иконка гамбургера с анимацией в крест при открытии
const BurgerIcon = ({ isOpen }: { isOpen: boolean }) => (
    <span
        className={`header__burger-icon${isOpen ? ' header__burger-icon--open' : ''}`}
        aria-hidden="true"
    >
        <span />
        <span />
        <span />
    </span>
);

const Header = () => {
    const [activeId, setActiveId] = useState<SectionId | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isPastHero, setIsPastHero] = useState(false);
    const { isAuthenticated, isLoading, logout } = useAuthInfo();
    const { isSavingMode, toggleSavingMode } = useAnimationMode();
    const { prefersReducedMotion } = useMotionPreference();
    const [showFireTooltip, setShowFireTooltip] = useState(false);
    const navigate = useNavigate();
    const topsRef = useRef<number[]>([]);

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
        const onScroll = () => {
            setActiveId(getActive());
            const threshold = topsRef.current[1] ?? window.innerHeight;
            setIsPastHero(window.scrollY >= threshold);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', cacheTops, { passive: true });
        onScroll();
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', cacheTops);
        };
    }, []);

    // Блокируем скролл страницы когда мобильное меню открыто (включая iOS Safari)
    useEffect(() => {
        if (!isOpen) return;

        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        const prevent = (e: TouchEvent) => {
            const menu = document.getElementById('header-mobile-menu');
            if (menu && !menu.contains(e.target as Node)) {
                e.preventDefault();
            }
        };

        document.addEventListener('touchmove', prevent, { passive: false });

        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.removeEventListener('touchmove', prevent);
        };
    }, [isOpen]);

    useEffect(() => {
        if (prefersReducedMotion || !isSavingMode) return;

        const showTooltip = () => {
            setShowFireTooltip(true);
            setTimeout(() => setShowFireTooltip(false), 3000);
        };

        const id = setInterval(showTooltip, 10_000);
        return () => clearInterval(id);
    }, [prefersReducedMotion, isSavingMode]);

    const handleLinkClick = useCallback(() => setIsOpen(false), []);

    const handleScrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleDesktopLogout = useCallback(async () => {
        await logout();
        navigate('/login');
    }, [logout, navigate]);

    const handleMobileLogout = useCallback(async () => {
        setIsOpen(false);
        try {
            await logout();
        } finally {
            navigate('/login');
        }
    }, [logout, navigate]);

    const handleMobileLogin = useCallback(() => {
        setIsOpen(false);
        navigate('/login');
    }, [navigate]);

    return (
        <>
            <button
                type="button"
                className={`header__companion${activeId === 'projects' ? ' header__companion--hidden' : ''}`}
                onClick={handleScrollToTop}
                aria-label="Наверх"
            >
                <Companion />
            </button>

            {/* Десктоп nav — горизонтальный до скролла hero, вертикальный после */}
            <ul className={`header${isPastHero ? ' header--scrolled' : ''}`}>
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
                {!isLoading && (
                    <li>
                        {isAuthenticated ? (
                            <button
                                type="button"
                                className="header__auth"
                                onClick={handleDesktopLogout}
                            >
                                <LogoutIcon />
                                Выйти
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="header__auth"
                                onClick={() => navigate('/login')}
                            >
                                <LoginIcon />
                                Войти
                            </button>
                        )}
                    </li>
                )}
                <li className="header__save-toggle-wrap">
                    <button
                        type="button"
                        className={`header__save-toggle${isSavingMode ? ' header__save-toggle--active' : ''}`}
                        onClick={toggleSavingMode}
                        title={isSavingMode ? 'Полный газ' : 'Сберегающий режим'}
                        aria-pressed={isSavingMode}
                        aria-label={
                            isSavingMode
                                ? 'Выключить сберегающий режим'
                                : 'Включить сберегающий режим'
                        }
                    >
                        <LeafIcon />
                    </button>
                    <ModeAlert />
                    {showFireTooltip && (
                        <span className="header__fire-tooltip" role="tooltip">
                            🔥 добавь огоньку
                        </span>
                    )}
                </li>
            </ul>

            {/* Свитчер под бургером — только мобилка */}
            <div className="header__save-wrap header__save-toggle-wrap">
                <button
                    type="button"
                    className={`header__save-toggle${isSavingMode ? ' header__save-toggle--active' : ''}`}
                    onClick={toggleSavingMode}
                    title={isSavingMode ? 'Полный газ' : 'Сберегающий режим'}
                    aria-pressed={isSavingMode}
                    aria-label={
                        isSavingMode ? 'Выключить сберегающий режим' : 'Включить сберегающий режим'
                    }
                >
                    <LeafIcon />
                </button>
                <ModeAlert silent />
                {showFireTooltip && (
                    <span className="header__fire-tooltip" role="tooltip">
                        🔥 добавь огоньку
                    </span>
                )}
            </div>

            {/* Гамбургер — SubmitButton с иконкой бургера, только на мобилке */}
            <div className="header__burger-wrap">
                <SubmitButton
                    isLoading={false}
                    buttonText=""
                    type="button"
                    aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
                    aria-expanded={isOpen}
                    aria-controls="header-mobile-menu"
                    icon={<BurgerIcon isOpen={isOpen} />}
                    iconPosition="left"
                    onClick={() => setIsOpen((v) => !v)}
                />
            </div>

            {/* Мобильное меню */}
            <nav
                id="header-mobile-menu"
                className={`header__mobile-menu${isOpen ? ' header__mobile-menu--open' : ''}`}
                aria-hidden={!isOpen}
            >
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

                    {/* Войти / Выйти как пункт меню */}
                    {!isLoading && (
                        <li>
                            {isAuthenticated ? (
                                <button
                                    type="button"
                                    className="header__mobile-auth"
                                    onClick={handleMobileLogout}
                                >
                                    <LogoutIcon />
                                    Выйти
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="header__mobile-auth"
                                    onClick={handleMobileLogin}
                                >
                                    <LoginIcon />
                                    Войти
                                </button>
                            )}
                        </li>
                    )}
                </ul>
            </nav>
        </>
    );
};

export default Header;
