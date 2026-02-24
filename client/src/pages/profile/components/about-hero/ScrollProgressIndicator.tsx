import { memo, useRef, useState, useEffect, useCallback, useId } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, type MotionValue } from 'framer-motion';
import './scroll-progress-indicator.css';

interface ScrollProgressIndicatorProps {
    containerRef: React.RefObject<HTMLElement | null>;
    headingSelector?: string;
    gateProgress?: MotionValue<number>;
}

const AMPLITUDE = 3;
const FREQUENCY = 24;
const CENTER_X = 6;
const PATH_WIDTH = 12;

function generateWavePath(height: number): string {
    if (height <= 0) return '';
    const points: string[] = [];
    for (let y = 0; y <= height; y += 1.5) {
        const x = CENTER_X + Math.sin((y / FREQUENCY) * Math.PI * 2) * AMPLITUDE;
        points.push(`${y === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return points.join(' ');
}

function getXOnWave(yPx: number): number {
    return CENTER_X + Math.sin((yPx / FREQUENCY) * Math.PI * 2) * AMPLITUDE;
}

export const ScrollProgressIndicator = memo(
    ({ containerRef, headingSelector = '.about-section__title', gateProgress }: ScrollProgressIndicatorProps) => {
        const uid = useId();
        const clipId = `track-clip-${uid}`;

        const [dotPositions, setDotPositions] = useState<number[]>([]);
        const [svgHeight, setSvgHeight] = useState(0);
        const indicatorRef = useRef<HTMLDivElement>(null);
        const scrollAtGateRef = useRef<number | null>(null);

        const { scrollYProgress } = useScroll({
            target: containerRef,
            offset: ['start 40%', 'end 60%'],
        });

        // Запоминаем значение scrollYProgress в момент когда gate достиг 1
        const gateSource = gateProgress ?? scrollYProgress;
        useMotionValueEvent(gateSource, 'change', (gate) => {
            if (gate >= 1 && scrollAtGateRef.current === null) {
                scrollAtGateRef.current = scrollYProgress.get();
            }
            if (gate < 1) {
                // Сброс если анимация повторяется (скролл вверх)
                scrollAtGateRef.current = null;
            }
        });

        // Нормализуем прогресс относительно момента разблокировки
        const effectiveProgress = useTransform(
            [scrollYProgress, gateSource] as MotionValue<number>[],
            ([scroll, gate]: number[]) => {
                if (gate < 1) return 0;
                const startScroll = scrollAtGateRef.current ?? scroll;
                const range = 1 - startScroll;
                if (range <= 0) return 1;
                return Math.min(Math.max((scroll - startScroll) / range, 0), 1);
            }
        );

        const clipY = useTransform(effectiveProgress, [0, 1], [svgHeight, 0]);

        const updateLayout = useCallback(() => {
            const container = containerRef.current;
            if (!container) return;

            const containerHeight = container.scrollHeight;
            setSvgHeight(containerHeight);

            const headings = container.querySelectorAll(headingSelector);
            const positions = Array.from(headings).map((heading) => {
                const headingElement = heading as HTMLElement;
                const containerRect = container.getBoundingClientRect();
                const headingRect = headingElement.getBoundingClientRect();
                const relativeTop = headingRect.top - containerRect.top + container.scrollTop;
                return (relativeTop / containerHeight) * 100;
            });

            setDotPositions(positions);
        }, [containerRef, headingSelector]);

        useEffect(() => {
            const timeoutId = setTimeout(updateLayout, 100);
            const container = containerRef.current;
            const resizeObserver = new ResizeObserver(updateLayout);
            if (container) resizeObserver.observe(container);

            return () => {
                clearTimeout(timeoutId);
                resizeObserver.disconnect();
            };
        }, [containerRef, updateLayout]);

        if (dotPositions.length === 0 || svgHeight === 0) return null;

        const wavePath = generateWavePath(svgHeight);

        return (
            <div ref={indicatorRef} className="scroll-progress-indicator">
                <svg
                    className="scroll-progress-indicator__svg"
                    width={PATH_WIDTH}
                    height={svgHeight}
                    viewBox={`0 0 ${PATH_WIDTH} ${svgHeight}`}
                    overflow="visible"
                >
                    <defs>
                        {/* Прямоугольник поднимается — трек виден только в незаполненной части */}
                        <clipPath id={clipId}>
                            <motion.rect
                                x={-AMPLITUDE}
                                width={PATH_WIDTH + AMPLITUDE * 2}
                                height={svgHeight}
                                style={{ y: clipY }}
                            />
                        </clipPath>
                    </defs>

                    {/* Трек — бледная волна, только незаполненная часть */}
                    <path d={wavePath} clipPath={`url(#${clipId})`} className="scroll-progress-indicator__track-path" />

                    {/* Прогресс — яркая волна, начинается с 0 после gate */}
                    <motion.path
                        d={wavePath}
                        className="scroll-progress-indicator__progress-path"
                        style={{ pathLength: effectiveProgress }}
                    />

                    {dotPositions.map((position, index) => {
                        const yPx = (position / 100) * svgHeight;
                        const xPx = getXOnWave(yPx);
                        const threshold = position / 100;

                        return (
                            <WaveDot
                                key={index}
                                cx={xPx}
                                cy={yPx}
                                threshold={threshold}
                                scrollYProgress={effectiveProgress}
                            />
                        );
                    })}
                </svg>
            </div>
        );
    }
);

ScrollProgressIndicator.displayName = 'ScrollProgressIndicator';

interface WaveDotProps {
    cx: number;
    cy: number;
    threshold: number;
    scrollYProgress: MotionValue<number>;
}

const WaveDot = memo(({ cx, cy, threshold, scrollYProgress }: WaveDotProps) => {
    const fillOpacity = useTransform(scrollYProgress, [threshold - 0.05, threshold + 0.05], [0, 1]);

    const scale = useTransform(scrollYProgress, [threshold - 0.05, threshold, threshold + 0.05], [1, 1.3, 1]);

    return (
        <motion.g style={{ scale, transformOrigin: `${cx}px ${cy}px` }}>
            <circle cx={cx} cy={cy} r={5} className="scroll-progress-indicator__dot-ring-svg" />
            <motion.circle
                cx={cx}
                cy={cy}
                r={3}
                className="scroll-progress-indicator__dot-fill-svg"
                style={{ opacity: fillOpacity }}
            />
        </motion.g>
    );
});

WaveDot.displayName = 'WaveDot';

export default ScrollProgressIndicator;
