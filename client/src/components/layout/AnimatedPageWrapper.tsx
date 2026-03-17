import { motion } from 'framer-motion';
import { type ReactNode, useCallback, useState } from 'react';
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
    enterFrom = 'right', // По умолчанию появляется справа
    exitTo = 'left', // По умолчанию уходит влево
}: AnimatedPageWrapperProps) => {
    const [isExiting, setIsExiting] = useState(false);
    const navigate = useNavigate();

    const handleExit = useCallback(() => {
        onExitStart?.();
        setIsExiting(true);

        if (navigateTo) {
            setTimeout(() => {
                navigate(navigateTo);
            }, exitDuration);
        }
    }, [onExitStart, navigateTo, exitDuration, navigate]);

    const contextProps: AnimatedPageContextProps = {
        isExiting,
        triggerExit: handleExit,
    };

    // Определяем направление для initial (вход)
    const getInitialX = () => {
        return enterFrom === 'left' ? -100 : 100;
    };

    // Определяем направление для exit (выход)
    const getExitX = () => {
        return exitTo === 'left' ? -100 : 100;
    };

    return (
        <motion.div
            className="animated-page-wrapper"
            initial={{
                opacity: 0,
                filter: 'blur(10px)',
                x: getInitialX(),
            }}
            animate={
                isExiting
                    ? {
                          opacity: 0,
                          filter: 'blur(10px)',
                          x: getExitX(),
                      }
                    : {
                          opacity: 1,
                          filter: '',
                          x: 0,
                      }
            }
            transition={{
                duration: isExiting ? exitDuration / 1000 : 0.4,
                ease: 'easeInOut',
            }}
            style={{
                width: '100%',
                minHeight: '100vh',
            }}
        >
            {typeof children === 'function' ? children(contextProps) : children}
        </motion.div>
    );
};

export default AnimatedPageWrapper;
