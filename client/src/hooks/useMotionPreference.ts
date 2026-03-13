import { useState, useEffect } from 'react';

interface MotionPreference {
    /** Пользователь включил "Уменьшить движение" в системе */
    prefersReducedMotion: boolean;
    /** Ширина экрана ≤ 1024px (мобилка + планшет) */
    isTabletOrMobile: boolean;
}

/**
 * Реактивно отслеживает системные media-query для управления анимациями.
 *
 * Использование в App.tsx:
 *   const { prefersReducedMotion, isTabletOrMobile } = useMotionPreference();
 *
 *   - prefersReducedMotion → не рендерить canvas вообще (a11y + производительность)
 *   - isTabletOrMobile     → статичные волны в WavesWithText
 */
export const useMotionPreference = (): MotionPreference => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
    const [isTabletOrMobile, setIsTabletOrMobile] = useState(
        () => window.matchMedia('(max-width: 1024px)').matches
    );

    useEffect(() => {
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const tabletQuery = window.matchMedia('(max-width: 1024px)');

        const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        const handleTabletChange = (e: MediaQueryListEvent) => setIsTabletOrMobile(e.matches);

        motionQuery.addEventListener('change', handleMotionChange);
        tabletQuery.addEventListener('change', handleTabletChange);

        return () => {
            motionQuery.removeEventListener('change', handleMotionChange);
            tabletQuery.removeEventListener('change', handleTabletChange);
        };
    }, []);

    return { prefersReducedMotion, isTabletOrMobile };
};
