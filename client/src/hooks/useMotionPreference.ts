import { useState, useEffect } from 'react';

interface MotionPreference {
    /** Пользователь включил "Уменьшить движение" в системе */
    prefersReducedMotion: boolean;
    /** Ширина экрана < 768px */
    isMobile: boolean;
}

/**
 * Реактивно отслеживает системные media-query для управления анимациями.
 *
 * Использование в App.tsx:
 *   const { prefersReducedMotion, isMobile } = useMotionPreference();
 *
 *   - prefersReducedMotion → не рендерить canvas вообще (a11y + производительность)
 *   - isMobile             → рендерить только лёгкий ThinWavesBackground
 */
export const useMotionPreference = (): MotionPreference => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
    const [isMobile, setIsMobile] = useState(
        () => window.matchMedia('(max-width: 767px)').matches
    );

    useEffect(() => {
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const mobileQuery = window.matchMedia('(max-width: 767px)');

        const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        const handleMobileChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);

        motionQuery.addEventListener('change', handleMotionChange);
        mobileQuery.addEventListener('change', handleMobileChange);

        return () => {
            motionQuery.removeEventListener('change', handleMotionChange);
            mobileQuery.removeEventListener('change', handleMobileChange);
        };
    }, []);

    return { prefersReducedMotion, isMobile };
};
