import { useAuthInfo } from 'client/src/hooks/useAuthInfo';
import { LogoutIcon } from 'client/src/assets/icons';
import { AnimatedPageWrapper } from 'client/src/components/layout/AnimatedPageWrapper';
import '@/pages/profile/profile-page.css';
import { SubmitButton } from '@/components/auth-form/components';
import Hero from '@/pages/profile/components/hero/Hero.tsx';
import AboutHero from '@/pages/profile/components/about-hero/AboutHero.tsx';
import Header from '@/components/header/Header.tsx';
import { useRef, useEffect, useCallback } from 'react';

export const ProfilePage = () => {
    const { user, logout, isLoading } = useAuthInfo();

    // Ref для таймера логаута — отменяется при размонтировании
    const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (logoutTimerRef.current !== null) {
                clearTimeout(logoutTimerRef.current);
            }
        };
    }, []);

    const handleLogout = useCallback((triggerExit: () => void) => {
        triggerExit();
        logoutTimerRef.current = setTimeout(() => {
            logout();
        }, 600);
    }, [logout]);

    if (isLoading) {
        return (
            <AnimatedPageWrapper>
                <div className="profile-container">
                    <div className="profile-card">
                        <p>Загрузка...</p>
                    </div>
                </div>
            </AnimatedPageWrapper>
        );
    }

    if (!user) {
        return (
            <AnimatedPageWrapper>
                <div className="profile-container">
                    <div className="profile-card">
                        <p className="error">Не удалось загрузить профиль</p>
                    </div>
                </div>
            </AnimatedPageWrapper>
        );
    }

    return (
        <AnimatedPageWrapper>
            {({ isExiting, triggerExit }) => (
                <div className="page-profile">
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
                    <Header />
                    <Hero />
                    <AboutHero />
                </div>
            )}
        </AnimatedPageWrapper>
    );
};
