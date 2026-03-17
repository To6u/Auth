import {
    type MotionValue,
    motion,
    useMotionValue,
    useMotionValueEvent,
    useScroll,
    useTransform,
} from 'framer-motion';
import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
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
const SCROLL_CHECK_THROTTLE_MS = 200;

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
    ({
        containerRef,
        headingSelector = '.about-section__title',
        gateProgress,
    }: ScrollProgressIndicatorProps) => {
        const uid = useId();
        const clipId = `track-clip-${uid}`;

        const [dotPositions, setDotPositions] = useState<number[]>([]);
        const [svgHeight, setSvgHeight] = useState(0);
        const prevHeightRef = useRef(0);
        const initializedRef = useRef(false);
        const lastScrollCheckRef = useRef(0);
        const wasVisibleRef = useRef(false);
        // ref для сравнения svgHeight (state) в MotionValue-колбэках без stale closure
        const svgHeightRef = useRef(0);
        svgHeightRef.current = svgHeight;

        const { scrollYProgress } = useScroll({
            target: containerRef,
            offset: ['start 40%', 'end 60%'],
        });

        const gateSource = gateProgress ?? scrollYProgress;
        const indicatorOpacity = useTransform(gateSource, [0.85, 1], [0, 1]);

        // MotionValue для высоты — clipY обновляется синхронно без зависимости от React state
        const svgHeightMV = useMotionValue(0);

        const clipY = useTransform(
            [scrollYProgress, svgHeightMV],
            ([scroll, height]: number[]) => scroll * height
        );

        const wavePath = useMemo(() => generateWavePath(svgHeight), [svgHeight]);

        const measureAndUpdate = useCallback(
            (sync: boolean) => {
                const container = containerRef.current;
                if (!container) return;

                const h = container.getBoundingClientRect().height;
                if (h === 0) return;

                const heightChanged = Math.abs(prevHeightRef.current - h) >= 1;
                if (!heightChanged && initializedRef.current) return;

                prevHeightRef.current = h;
                initializedRef.current = true;

                // Мгновенно — clipY подхватит на следующем кадре без React рендера
                svgHeightMV.set(h);

                const headings = container.querySelectorAll(headingSelector);
                const positions = Array.from(headings).map((heading) => {
                    const el = heading as HTMLElement;
                    const containerRect = container.getBoundingClientRect();
                    const headingRect = el.getBoundingClientRect();
                    return ((headingRect.top - containerRect.top) / h) * 100;
                });

                const applyState = () => {
                    setSvgHeight(h);
                    setDotPositions(positions);
                };

                if (sync) {
                    flushSync(applyState);
                } else {
                    applyState();
                }
            },
            [containerRef, headingSelector, svgHeightMV]
        );

        // Re-measure при появлении индикатора — ловит рассинхрон когда prevHeightRef
        // обновился (ResizeObserver), но setSvgHeight не прошёл (flushSync вне React)
        useMotionValueEvent(indicatorOpacity, 'change', (v) => {
            const isVisible = v > 0.01;
            if (isVisible && !wasVisibleRef.current) {
                wasVisibleRef.current = true;
                const container = containerRef.current;
                if (!container) return;
                const h = container.getBoundingClientRect().height;
                // Сравниваем с svgHeight state (не prevHeightRef — он мог обновиться без state)
                if (Math.abs(svgHeightRef.current - h) > 2) {
                    prevHeightRef.current = 0; // сбрасываем чтобы heightChanged guard пропустил
                    measureAndUpdate(false);
                }
            } else if (!isVisible) {
                wasVisibleRef.current = false;
            }
        });

        // Throttled fallback — ловит рассинхрон после AnimatePresence exit
        useMotionValueEvent(scrollYProgress, 'change', () => {
            const now = performance.now();
            if (now - lastScrollCheckRef.current < SCROLL_CHECK_THROTTLE_MS) return;
            lastScrollCheckRef.current = now;

            const container = containerRef.current;
            if (!container) return;
            const h = container.getBoundingClientRect().height;
            if (Math.abs(prevHeightRef.current - h) > 2) {
                measureAndUpdate(false);
            }
        });

        useEffect(() => {
            measureAndUpdate(false);

            const container = containerRef.current;
            if (!container) return;

            const onResize = () => {
                // sync=false: избегаем flushSync вне React-контекста (ResizeObserver)
                measureAndUpdate(false);
                // Заставляем Framer Motion пересчитать scrollYProgress с новой геометрией
                window.dispatchEvent(new Event('scroll'));
            };

            const resizeObserver = new ResizeObserver(onResize);
            resizeObserver.observe(container);

            return () => resizeObserver.disconnect();
        }, [containerRef, measureAndUpdate]);

        if (dotPositions.length === 0 || svgHeight === 0) return null;

        return (
            <motion.div className="scroll-progress-indicator" style={{ opacity: indicatorOpacity }}>
                <svg
                    className="scroll-progress-indicator__svg"
                    width={PATH_WIDTH}
                    height={svgHeight}
                    viewBox={`0 0 ${PATH_WIDTH} ${svgHeight}`}
                    overflow="visible"
                    preserveAspectRatio="xMidYMin meet"
                >
                    <defs>
                        <clipPath id={clipId}>
                            <motion.rect
                                x={-AMPLITUDE}
                                width={PATH_WIDTH + AMPLITUDE * 2}
                                height={svgHeight}
                                style={{ y: clipY }}
                            />
                        </clipPath>
                    </defs>

                    <path
                        d={wavePath}
                        clipPath={`url(#${clipId})`}
                        className="scroll-progress-indicator__track-path"
                    />

                    <motion.path
                        d={wavePath}
                        className="scroll-progress-indicator__progress-path"
                        style={{ pathLength: scrollYProgress }}
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
                                scrollYProgress={scrollYProgress}
                            />
                        );
                    })}
                </svg>
            </motion.div>
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
    const dotOpacity = useTransform(scrollYProgress, [threshold - 0.02, threshold], [0, 1]);

    const fillOpacity = useTransform(scrollYProgress, [threshold - 0.02, threshold + 0.03], [0, 1]);

    const scale = useTransform(
        scrollYProgress,
        [threshold - 0.02, threshold, threshold + 0.03],
        [0.5, 1.3, 1]
    );

    return (
        <motion.g style={{ scale, opacity: dotOpacity, transformOrigin: `${cx}px ${cy}px` }}>
            <motion.circle
                cx={cx}
                cy={cy}
                r={6}
                className="scroll-progress-indicator__dot-fill-svg"
                style={{ opacity: fillOpacity }}
            />
        </motion.g>
    );
});

WaveDot.displayName = 'WaveDot';

export default ScrollProgressIndicator;
