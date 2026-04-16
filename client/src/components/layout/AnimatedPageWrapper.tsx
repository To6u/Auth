import { motion } from 'framer-motion';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AnimatedPageContextProps {
    isExiting: boolean;
    triggerExit: () => void;
}

type AnimationDirection = 'left' | 'right';

interface AnimatedPageWrapperProps {
    children: ReactNode | ((props: AnimatedPageContextProps) => ReactNode);
    navigateTo?: string; // Путь для перехода после анимации
    exitDuration?: number;
    onExitStart?: () => void;
    enterFrom?: AnimationDirection; // Откуда появляется страница
    exitTo?: AnimationDirection; // Куда уходит страница
}

export const AnimatedPageWrapper = ({
    children,
    navigateTo,
    exitDuration = 600,
    onExitStart,
    enterFrom = 'right',
    exitTo = 'left',
}: AnimatedPageWrapperProps) => {
    const [isExiting, setIsExiting] = useState(false);
    const navigate = useNavigate();
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        return () => clearTimeout(timerRef.current);
    }, []);

    const handleExit = useCallback(() => {
        onExitStart?.();
        setIsExiting(true);

        if (navigateTo) {
            timerRef.current = setTimeout(() => {
                navigate(navigateTo);
            }, exitDuration);
        }
    }, [onExitStart, navigateTo, exitDuration, navigate]);

    const contextProps = useMemo<AnimatedPageContextProps>(
        () => ({ isExiting, triggerExit: handleExit }),
        [isExiting, handleExit]
    );

    const initialX = enterFrom === 'left' ? '-100%' : '100%';
    const exitX = exitTo === 'left' ? '-100%' : '100%';

    return (
        <motion.div
            className="animated-page-wrapper"
            initial={{ opacity: 0, x: initialX }}
            animate={isExiting ? { opacity: 0, x: exitX } : { opacity: 1, x: 0 }}
            transition={{
                duration: isExiting ? exitDuration / 1000 : 0.4,
                ease: 'easeInOut',
            }}
        >
            {typeof children === 'function' ? children(contextProps) : children}
        </motion.div>
    );
};

export default AnimatedPageWrapper;
