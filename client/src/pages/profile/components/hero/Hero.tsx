import { useEffect, useState } from 'react';
import '@/pages/profile/components/hero/hero.css';
import MorphingWord from '@/components/morphing-text/MorphingWord';
import StaticLetters from '@/components/morphing-text/StaticLetters';

const ANIMATION_DELAY = 100;

const Hero = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), ANIMATION_DELAY);
        return () => clearTimeout(timer);
    }, []);

    return (
        <section className="hero">
            <div className={`hero__content ${isVisible ? 'visible' : ''}`}>
                <div className="hero__subtitle">
                    <StaticLetters />
                    <MorphingWord />
                </div>
            </div>
        </section>
    );
};

export default Hero;