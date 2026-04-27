import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useNavigationDirection } from '@/context/NavigationDirectionContext';

// CSS linear() → JS easing для opacity.
// Кривая: быстрый выход к 1 (~25%), overshoot до 1.121, пульсирует и оседает к t=0.81.
const OPACITY_POINTS: [number, number][] = [
    [0, 0],
    [0.014, 0.009],
    [0.028, 0.032],
    [0.06, 0.131],
    [0.091, 0.265],
    [0.176, 0.675],
    [0.228, 0.88],
    [0.252, 0.953],
    [0.277, 1.014],
    [0.303, 1.062],
    [0.329, 1.094],
    [0.372, 1.121],
    [0.422, 1.121],
    [0.467, 1.102],
    [0.612, 1.019],
    [0.715, 0.989],
    [0.811, 0.985],
    [1, 1],
];

function opacityEase(t: number): number {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    for (let i = 1; i < OPACITY_POINTS.length; i++) {
        const prev = OPACITY_POINTS[i - 1];
        const curr = OPACITY_POINTS[i];
        if (prev && curr && t <= curr[0]) {
            const p = (t - prev[0]) / (curr[0] - prev[0]);
            return prev[1] + (curr[1] - prev[1]) * p;
        }
    }
    return 1;
}

const ENTER_TRANSITION = {
    x: { duration: 0.4, ease: [0, 0, 0.2, 1] as const },
    opacity: { duration: 0.5, ease: opacityEase },
};

const EXIT_TRANSITION = {
    x: { duration: 0.25, ease: [0.4, 0, 1, 1] as const },
    opacity: { duration: 0.2, ease: [0.4, 0, 1, 1] as const },
};

interface AnimatedPageWrapperProps {
    children: ReactNode;
}

export const AnimatedPageWrapper = ({ children }: AnimatedPageWrapperProps) => {
    const direction = useNavigationDirection();
    const enterX = direction === 'forward' ? '100%' : '-100%';
    const exitX = direction === 'forward' ? '-100%' : '100%';

    return (
        <motion.div
            className="animated-page-wrapper"
            initial={{ opacity: 0, x: enterX }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: exitX, transition: EXIT_TRANSITION }}
            transition={ENTER_TRANSITION}
        >
            {children}
        </motion.div>
    );
};

export default AnimatedPageWrapper;
