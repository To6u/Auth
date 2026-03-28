import '@/pages/profile/profile-page.css';
import Header from '@/components/header/Header.tsx';
import { AnimatedPageWrapper } from '@/components/layout/AnimatedPageWrapper';
import AboutHero from '@/pages/profile/components/about-hero/AboutHero.tsx';
import { Contacts } from '@/pages/profile/components/contacts/Contacts';
import Hero from '@/pages/profile/components/hero/Hero.tsx';
import { Projects } from '@/pages/profile/components/projects';

export const ProfilePage = () => {
    return (
        <AnimatedPageWrapper>
            {() => (
                <div className="page-profile">
                    <Header />
                    <Hero />
                    <AboutHero />
                    <Projects />
                    <Contacts />
                </div>
            )}
        </AnimatedPageWrapper>
    );
};
