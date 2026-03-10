import { useAuthInfo } from 'client/src/hooks/useAuthInfo';
import { LogoutIcon } from 'client/src/assets/icons';
import { AnimatedPageWrapper } from 'client/src/components/layout/AnimatedPageWrapper';
import '@/pages/profile/profile-page.css';
import { SubmitButton } from '@/components/auth-form/components';
import Hero from '@/pages/profile/components/hero/Hero.tsx';
import AboutHero from '@/pages/profile/components/about-hero/AboutHero.tsx';
import { Projects } from '@/pages/profile/components/projects';
import Header from '@/components/header/Header.tsx';
import { useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

export const ProfilePage = () => {
    const { isAuthenticated, isLoading, logout } = useAuthInfo();

    // Ref для таймера логаута — отменяется при размонтировании
    const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (logoutTimerRef.current !== null) {
                clearTimeout(logoutTimerRef.current);
            }
        };
    }, []);

    const handleLogout = useCallback(
        (triggerExit: () => void) => {
            triggerExit();
            logoutTimerRef.current = setTimeout(() => {
                logout();
            }, 600);
        },
        [logout]
    );

    return (
        <AnimatedPageWrapper>
            {({ isExiting, triggerExit }) => (
                <div className="page-profile">
                    {/* Auth action — shown after auth state resolves */}
                    {!isLoading && (
                        isAuthenticated ? (
                            <SubmitButton
                                isLoading={isExiting}
                                buttonText=""
                                loadingText=""
                                icon={<LogoutIcon />}
                                iconPosition="left"
                                animationDirection="right"
                                onClick={() => handleLogout(triggerExit)}
                                type="button"
                            />
                        ) : (
                            <Link to="/login" className="profile-login-link">
                                Войти
                            </Link>
                        )
                    )}

                    <Header />
                    <Hero />
                    <AboutHero />
                    <Projects />
                </div>
            )}
        </AnimatedPageWrapper>
    );
};
