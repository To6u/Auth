import { memo, useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import './scroll-progress-indicator.css';

interface ScrollProgressIndicatorProps {
    /** Ref контейнера, внутри которого отслеживается скролл */
    containerRef: React.RefObject<HTMLElement | null>;
    /** Селектор для поиска заголовков (точек) */
    headingSelector?: string;
}

export const ScrollProgressIndicator = memo(
    ({ containerRef, headingSelector = '.about-section__title' }: ScrollProgressIndicatorProps) => {
        const [dotPositions, setDotPositions] = useState<number[]>([]);
        const indicatorRef = useRef<HTMLDivElement>(null);

        // Скролл прогресс внутри контейнера
        const { scrollYProgress } = useScroll({
            target: containerRef,
            offset: ['start 40%', 'end 60%'],
        });

        // Вычисляем позиции точек относительно контейнера
        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            const calculatePositions = () => {
                const headings = container.querySelectorAll(headingSelector);
                const containerHeight = container.scrollHeight;

                const positions = Array.from(headings).map((heading) => {
                    const headingElement = heading as HTMLElement;
                    // Получаем позицию относительно контейнера через getBoundingClientRect
                    const containerRect = container.getBoundingClientRect();
                    const headingRect = headingElement.getBoundingClientRect();

                    // Текущий скролл + разница позиций
                    const relativeTop = headingRect.top - containerRect.top + container.scrollTop;

                    return (relativeTop / containerHeight) * 100;
                });

                setDotPositions(positions);
            };

            // Небольшая задержка для корректного расчёта после рендера
            const timeoutId = setTimeout(calculatePositions, 100);

            const resizeObserver = new ResizeObserver(calculatePositions);
            resizeObserver.observe(container);

            return () => {
                clearTimeout(timeoutId);
                resizeObserver.disconnect();
            };
        }, [containerRef, headingSelector]);

        // Высота заполненной линии (в процентах)
        const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

        if (dotPositions.length === 0) return null;

        return (
            <div ref={indicatorRef} className="scroll-progress-indicator">
                {/* Фоновая линия */}
                <div className="scroll-progress-indicator__track" />

                {/* Заполненная линия */}
                <motion.div className="scroll-progress-indicator__progress" style={{ height: lineHeight }} />

                {/* Точки */}
                {dotPositions.map((position, index) => (
                    <ScrollDot key={index} position={position} index={index} scrollYProgress={scrollYProgress} />
                ))}
            </div>
        );
    }
);

ScrollProgressIndicator.displayName = 'ScrollProgressIndicator';

// Отдельный компонент для точки с собственной анимацией
interface ScrollDotProps {
    position: number;
    index: number;
    scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress'];
}

const ScrollDot = memo(({ position, index, scrollYProgress }: ScrollDotProps) => {
    // Точка заполняется когда скролл достигает её позиции
    const threshold = position / 100;

    const fillOpacity = useTransform(scrollYProgress, [threshold - 0.05, threshold + 0.05], [0, 1]);

    const scale = useTransform(scrollYProgress, [threshold - 0.05, threshold, threshold + 0.05], [1, 1.3, 1]);

    return (
        <motion.div
            className="scroll-progress-indicator__dot"
            style={{
                top: `${position}%`,
                scale,
            }}
        >
            {/* Внешний круг (пустой) */}
            <div className="scroll-progress-indicator__dot-ring" />
            {/* Внутренний круг (заполненный) */}
            <motion.div className="scroll-progress-indicator__dot-fill" style={{ opacity: fillOpacity }} />
        </motion.div>
    );
});

ScrollDot.displayName = 'ScrollDot';

export default ScrollProgressIndicator;
