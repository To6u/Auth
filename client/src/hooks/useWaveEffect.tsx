import { type MotionValue, useMotionValueEvent } from 'framer-motion';
import { useCallback, useEffect, useId, useRef } from 'react';

interface UseWaveEffectOptions {
    maxScale?: number;
    frequencyX?: number;
    frequencyY?: number;
    threshold?: number;
    hoverTransitionSpeed?: number;
    /**
     * Если true — фильтр всегда активен, scroll progress игнорируется.
     * Убирается только при hover. Автоматически снимается когда контейнер вне вьюпорта.
     */
    alwaysOn?: boolean;
}

export const useWaveEffect = (
    scaleProgress: MotionValue<number>,
    options: UseWaveEffectOptions = {}
) => {
    const {
        maxScale = 25,
        frequencyX = 0.015,
        frequencyY = 0.08,
        threshold = 0.02,
        hoverTransitionSpeed = 0.08,
        alwaysOn = false,
    } = options;

    const filterId = useId();
    const displacementRef = useRef<SVGFEDisplacementMapElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const isVisibleRef = useRef(false);
    const isPageVisibleRef = useRef(true);

    const isHoveredRef = useRef(false);
    const scrollScaleRef = useRef(0);
    const currentScaleRef = useRef(0);
    const animationRef = useRef<number>(0);
    const isAnimatingRef = useRef(false);

    // Page Visibility API
    useEffect(() => {
        const handleVisibility = () => {
            isPageVisibleRef.current = !document.hidden;
            if (!isPageVisibleRef.current) {
                cancelAnimationFrame(animationRef.current);
                isAnimatingRef.current = false;
                if (alwaysOn) {
                    currentScaleRef.current = 0;
                    const container = containerRef.current;
                    const displacement = displacementRef.current;
                    if (container) container.style.filter = 'none';
                    if (displacement) displacement.setAttribute('scale', '0');
                }
            } else if (alwaysOn && isVisibleRef.current) {
                scrollScaleRef.current = maxScale;
                startAnimation();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [alwaysOn, maxScale, startAnimation]);

    // IntersectionObserver
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting;
                if (!isVisibleRef.current) {
                    cancelAnimationFrame(animationRef.current);
                    isAnimatingRef.current = false;
                    if (alwaysOn) {
                        currentScaleRef.current = 0;
                        const displacement = displacementRef.current;
                        if (container) container.style.filter = 'none';
                        if (displacement) displacement.setAttribute('scale', '0');
                    }
                } else if (alwaysOn && isPageVisibleRef.current) {
                    scrollScaleRef.current = maxScale;
                    startAnimation();
                }
            },
            { rootMargin: '100px' }
        );

        observer.observe(container);
        return () => observer.disconnect();
    }, [alwaysOn, maxScale, startAnimation]);

    const startAnimation = useCallback(() => {
        if (isAnimatingRef.current) return;
        isAnimatingRef.current = true;

        const animate = () => {
            const displacement = displacementRef.current;
            const container = containerRef.current;
            if (!displacement || !container) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }

            const targetScale = isHoveredRef.current ? 0 : scrollScaleRef.current;
            const current = currentScaleRef.current;
            const diff = targetScale - current;

            if (Math.abs(diff) > 0.1) {
                currentScaleRef.current = current + diff * hoverTransitionSpeed;
                displacement.setAttribute('scale', String(currentScaleRef.current));
                if (container.style.filter === 'none' || container.style.filter === '') {
                    container.style.filter = `url(#${filterId})`;
                }
                animationRef.current = requestAnimationFrame(animate);
            } else {
                currentScaleRef.current = targetScale;
                displacement.setAttribute('scale', String(targetScale));
                if (targetScale < 0.5) {
                    container.style.filter = 'none';
                } else {
                    container.style.filter = `url(#${filterId})`;
                }
                isAnimatingRef.current = false;
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [hoverTransitionSpeed, filterId]);

    // Hover tracking
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleEnter = () => {
            isHoveredRef.current = true;
            if (isVisibleRef.current && isPageVisibleRef.current) startAnimation();
        };

        const handleLeave = () => {
            isHoveredRef.current = false;
            if (isVisibleRef.current && isPageVisibleRef.current) startAnimation();
        };

        container.addEventListener('mouseenter', handleEnter);
        container.addEventListener('mouseleave', handleLeave);

        return () => {
            container.removeEventListener('mouseenter', handleEnter);
            container.removeEventListener('mouseleave', handleLeave);
        };
    }, [startAnimation]);

    // Scroll listener — игнорируем в alwaysOn режиме
    useMotionValueEvent(scaleProgress, 'change', (latest) => {
        if (alwaysOn || !isVisibleRef.current || !isPageVisibleRef.current) return;

        const scale = latest > threshold ? latest * maxScale : 0;
        const prevScale = scrollScaleRef.current;
        scrollScaleRef.current = scale;

        if (Math.abs(scale - prevScale) > 0.1) {
            startAnimation();
        }
    });

    useEffect(() => () => cancelAnimationFrame(animationRef.current), []);

    const WaveFilter = useCallback(
        () => (
            <svg
                style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
                aria-hidden="true"
            >
                <defs>
                    <filter id={filterId} colorInterpolationFilters="sRGB">
                        <feTurbulence
                            type="turbulence"
                            baseFrequency={`${frequencyX} ${frequencyY}`}
                            numOctaves={1}
                            result="noise"
                        />
                        <feDisplacementMap
                            ref={displacementRef}
                            in="SourceGraphic"
                            in2="noise"
                            scale="0"
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </defs>
            </svg>
        ),
        [filterId, frequencyX, frequencyY]
    );

    return { WaveFilter, containerRef };
};
