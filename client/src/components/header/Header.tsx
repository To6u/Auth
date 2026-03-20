import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubmitButton } from '@/components/auth-form/components/SubmitButton/SubmitButton';
import { useAuthInfo } from '@/hooks/useAuthInfo';
import './header.css';

const NAV_ITEMS = [
    { id: 'deer', label: 'De|eR' },
    { id: 'place', label: 'Откуда' },
    { id: 'way', label: 'Путь' },
    { id: 'projects', label: 'Проекты' },
    { id: 'contacts', label: 'СЦ' },
] as const;

type SectionId = (typeof NAV_ITEMS)[number]['id'];

const LoginIcon = () => (
    <svg
        aria-hidden="true"
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
);

const LogoutIcon = () => (
    <svg
        aria-hidden="true"
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
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

    const handleLinkClick = useCallback(() => setIsOpen(false), []);

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
            </ul>

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
                                    className="header__mobile-auth"
                                    onClick={handleMobileLogout}
                                >
                                    <LogoutIcon />
                                    Выйти
                                </button>
                            ) : (
                                <button className="header__mobile-auth" onClick={handleMobileLogin}>
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
