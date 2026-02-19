import { useRef, useCallback, useId, useEffect, useState } from 'react';
import { useMotionValueEvent, type MotionValue } from 'framer-motion';

interface UseWaveEffectOptions {
    maxScale?: number;
    frequencyX?: number;
    frequencyY?: number;
    threshold?: number;
    hoverTransitionSpeed?: number;
}

export const useWaveEffect = (scaleProgress: MotionValue<number>, options: UseWaveEffectOptions = {}) => {
    const {
        maxScale = 25,
        frequencyX = 0.015,
        frequencyY = 0.08,
        threshold = 0.02,
        hoverTransitionSpeed = 0.15,
    } = options;

    const filterId = useId();
    const displacementRef = useRef<SVGFEDisplacementMapElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isVisible, setIsVisible] = useState(false);
    const [isPageVisible, setIsPageVisible] = useState(true);

    const isHoveredRef = useRef(false);
    const scrollScaleRef = useRef(0);
    const currentScaleRef = useRef(0);
    const animationRef = useRef<number>(0);
    const isAnimatingRef = useRef(false);

    // Page Visibility API
    useEffect(() => {
        const handleVisibility = () => setIsPageVisible(!document.hidden);
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    // IntersectionObserver
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
            rootMargin: '100px',
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    // Запуск анимации (только когда нужно)
    const startAnimation = useCallback(() => {
        if (isAnimatingRef.current) return;
        isAnimatingRef.current = true;

        const animate = () => {
            const displacement = displacementRef.current;
            if (!displacement) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }

            const targetScale = isHoveredRef.current ? 0 : scrollScaleRef.current;
            const current = currentScaleRef.current;
            const diff = targetScale - current;

            if (Math.abs(diff) > 0.1) {
                currentScaleRef.current = current + diff * hoverTransitionSpeed;
                displacement.setAttribute('scale', String(currentScaleRef.current));
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Стабилизировалось — останавливаем loop
                currentScaleRef.current = targetScale;
                displacement.setAttribute('scale', String(targetScale));
                isAnimatingRef.current = false;
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [hoverTransitionSpeed]);

    // Cleanup при выходе из viewport или скрытии вкладки
    useEffect(() => {
        if (!isVisible || !isPageVisible) {
            cancelAnimationFrame(animationRef.current);
            isAnimatingRef.current = false;
        }
    }, [isVisible, isPageVisible]);

    // Hover tracking
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleEnter = () => {
            isHoveredRef.current = true;
            if (isVisible && isPageVisible) startAnimation();
        };

        const handleLeave = () => {
            isHoveredRef.current = false;
            if (isVisible && isPageVisible) startAnimation();
        };

        container.addEventListener('mouseenter', handleEnter);
        container.addEventListener('mouseleave', handleLeave);

        return () => {
            container.removeEventListener('mouseenter', handleEnter);
            container.removeEventListener('mouseleave', handleLeave);
        };
    }, [isVisible, isPageVisible, startAnimation]);

    // Применяем фильтр при маунте
    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.style.filter = `url(#${filterId})`;
        }
    }, [filterId]);

    // Scroll listener
    useMotionValueEvent(scaleProgress, 'change', (latest) => {
        if (!isVisible || !isPageVisible) return;

        const scale = latest > threshold ? latest * maxScale : 0;
        const prevScale = scrollScaleRef.current;
        scrollScaleRef.current = scale;

        // Запускаем анимацию только если значение изменилось
        if (Math.abs(scale - prevScale) > 0.1) {
            startAnimation();
        }
    });

    useEffect(() => () => cancelAnimationFrame(animationRef.current), []);

    const WaveFilter = useCallback(
        () => (
            <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
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
