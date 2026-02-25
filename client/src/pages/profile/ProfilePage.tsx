import { useAuthInfo } from 'client/src/hooks/useAuthInfo';
import { LogoutIcon } from 'client/src/assets/icons';
import { AnimatedPageWrapper } from 'client/src/components/layout/AnimatedPageWrapper';
import '@/pages/profile/profile-page.css';
import { SubmitButton } from '@/components/auth-form/components';
import Hero from '@/pages/profile/components/hero/Hero.tsx';
import AboutHero from '@/pages/profile/components/about-hero/AboutHero.tsx';
import Header from '@/components/header/Header.tsx';

export const ProfilePage = () => {
    const { user, logout, isLoading } = useAuthInfo();

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
                        onClick={() => {
                            triggerExit();
                            setTimeout(() => {
                                logout();
                            }, 600);
                        }}
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
