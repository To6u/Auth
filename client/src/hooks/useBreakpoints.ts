import { useEffect, useState } from 'react';

export const BREAKPOINTS = {
    mobile: '(max-width: 480px)',
    mobileLayout: '(max-width: 767px)',
    tabletOrMobile: '(max-width: 1024px)',
} as const;

interface Breakpoints {
    isMobile: boolean;
    isMobileLayout: boolean;
    isTabletOrMobile: boolean;
}

export const useBreakpoints = (): Breakpoints => {
    const [isMobile, setIsMobile] = useState(() => window.matchMedia(BREAKPOINTS.mobile).matches);
    const [isMobileLayout, setIsMobileLayout] = useState(
        () => window.matchMedia(BREAKPOINTS.mobileLayout).matches
    );
    const [isTabletOrMobile, setIsTabletOrMobile] = useState(
        () => window.matchMedia(BREAKPOINTS.tabletOrMobile).matches
    );

    useEffect(() => {
        const mq480 = window.matchMedia(BREAKPOINTS.mobile);
        const mq767 = window.matchMedia(BREAKPOINTS.mobileLayout);
        const mq1024 = window.matchMedia(BREAKPOINTS.tabletOrMobile);

        const h480 = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        const h767 = (e: MediaQueryListEvent) => setIsMobileLayout(e.matches);
        const h1024 = (e: MediaQueryListEvent) => setIsTabletOrMobile(e.matches);

        mq480.addEventListener('change', h480);
        mq767.addEventListener('change', h767);
        mq1024.addEventListener('change', h1024);

        return () => {
            mq480.removeEventListener('change', h480);
            mq767.removeEventListener('change', h767);
            mq1024.removeEventListener('change', h1024);
        };
    }, []);

    return { isMobile, isMobileLayout, isTabletOrMobile };
};
