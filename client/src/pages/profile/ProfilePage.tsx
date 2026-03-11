import { useAuthInfo } from 'client/src/hooks/useAuthInfo';
import { LogoutIcon } from 'client/src/assets/icons';
import { AnimatedPageWrapper } from 'client/src/components/layout/AnimatedPageWrapper';
import '@/pages/profile/profile-page.css';
import { SubmitButton } from '@/components/auth-form/components/SubmitButton/SubmitButton';
import Hero from '@/pages/profile/components/hero/Hero.tsx';
import AboutHero from '@/pages/profile/components/about-hero/AboutHero.tsx';
import { Projects } from '@/pages/profile/components/projects';
import Header from '@/components/header/Header.tsx';
import { useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
    const { isAuthenticated, isLoading, logout } = useAuthInfo();
    const navigate = useNavigate();

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
            logoutTimerRef.current = setTimeout(async () => {
                await logout();
                navigate('/login');
            }, 600);
        },
        [logout, navigate]
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
                            <SubmitButton
                                isLoading={false}
                                buttonText="Войти"
                                onClick={() => navigate('/login')}
                                type="button"
                            />
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
