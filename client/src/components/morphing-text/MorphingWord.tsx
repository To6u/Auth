import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import './morphing-word.css';

interface Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    originalX1: number;
    originalY1: number;
    originalX2: number;
    originalY2: number;
    signX1: number;
    signY1: number;
    signX2: number;
    signY2: number;
}

const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 440;
const LINE_SPACING = 20;
const FONT_SIZE = 540;
const MORPH_DURATION = 5000;

// Thresholds для IntersectionObserver — 7 вместо 101
const INTERSECTION_THRESHOLDS = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];

const createTextCanvas = (text: string, x: number, y: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH + 400;
    canvas.height = CANVAS_HEIGHT + 100;

    const ctx = canvas.getContext('2d', {
        alpha: true,
        willReadFrequently: true,
    });
    if (!ctx) throw new Error('Canvas context not available');

    ctx.font = `italic 900 ${FONT_SIZE}px Inter, sans-serif`;
    ctx.fillStyle = '#E5FFAB';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '-40px';
    ctx.fillText(text, x, y);

    return canvas;
};

const extractHorizontalLines = (
    imageData: Uint8ClampedArray,
    width: number,
    height: number
): Array<{ y: number; x1: number; x2: number }> => {
    const lines: Array<{ y: number; x1: number; x2: number }> = [];

    for (let y = 0; y < height; y += LINE_SPACING) {
        let lineStart = -1;

        for (let x = 300; x < 2500; x++) {
            const index = (y * width + x) * 4;
            const alpha = imageData[index + 3];

            if (alpha > 128) {
                if (lineStart === -1) lineStart = x;
            } else if (lineStart !== -1) {
                lines.push({ y, x1: lineStart, x2: x - 1 });
                lineStart = -1;
            }
        }

        if (lineStart !== -1) {
            lines.push({ y, x1: lineStart, x2: 2499 });
        }
    }

    return lines;
};

const useFontLoader = () => {
    const [fontLoaded, setFontLoaded] = useState(false);

    useEffect(() => {
        const loadFont = async () => {
            try {
                if (document.fonts) {
                    await document.fonts.load(`italic 900 ${FONT_SIZE}px Inter`);
                }
                setFontLoaded(true);
            } catch {
                setTimeout(() => setFontLoaded(true), 100);
            }
        };

        loadFont();
    }, []);

    return fontLoaded;
};

const useLineInitialization = (fontLoaded: boolean) => {
    const linesRef = useRef<Line[]>([]);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!fontLoaded || initializedRef.current) return;

        try {
            const velopCanvas = createTextCanvas('VELOP', 360, 210);
            const velopCtx = velopCanvas.getContext('2d');
            if (!velopCtx) return;

            const signCanvas = createTextCanvas('SIGN', 580, 210);
            const signCtx = signCanvas.getContext('2d');
            if (!signCtx) return;

            const velopImageData = velopCtx.getImageData(0, 0, velopCanvas.width, velopCanvas.height);
            const signImageData = signCtx.getImageData(0, 0, signCanvas.width, signCanvas.height);

            const velopLines = extractHorizontalLines(velopImageData.data, velopCanvas.width, velopCanvas.height);
            const signLines = extractHorizontalLines(signImageData.data, signCanvas.width, signCanvas.height);

            const maxLines = Math.max(velopLines.length, signLines.length);
            const lines: Line[] = [];

            for (let i = 0; i < maxLines; i++) {
                const velopLine = velopLines[i % velopLines.length];
                const signLine = signLines[i % signLines.length];

                lines.push({
                    x1: velopLine.x1,
                    y1: velopLine.y,
                    x2: velopLine.x2,
                    y2: velopLine.y,
                    originalX1: velopLine.x1,
                    originalY1: velopLine.y,
                    originalX2: velopLine.x2,
                    originalY2: velopLine.y,
                    signX1: signLine.x1,
                    signY1: signLine.y,
                    signX2: signLine.x2,
                    signY2: signLine.y,
                });
            }

            linesRef.current = lines;
            initializedRef.current = true;
        } catch (error) {
            console.error('Line initialization failed:', error);
        }
    }, [fontLoaded]);

    return linesRef;
};

const useInitialAnimation = (fontLoaded: boolean, linesRef: React.MutableRefObject<Line[]>, isInViewport: boolean) => {
    const [initialAnimationComplete, setInitialAnimationComplete] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationProgress = useMotionValue(0);
    const smoothProgress = useSpring(animationProgress, {
        stiffness: 50,
        damping: 20,
        mass: 1,
    });

    useEffect(() => {
        // Не запускаем начальную анимацию если не в viewport
        if (!fontLoaded || linesRef.current.length === 0 || initialAnimationComplete || !isInViewport) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', {
            alpha: true,
            desynchronized: true,
            willReadFrequently: false,
        });
        if (!ctx) return;

        const unsubscribe = smoothProgress.on('change', (latest) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const linesPath = new Path2D();
            linesRef.current.forEach((line, index) => {
                const direction = index % 2 === 0 ? 1 : -1;
                const currentX1 = line.originalX1 - direction * 800 * (1 - latest);
                const currentX2 = line.originalX2 - direction * 800 * (1 - latest);

                linesPath.moveTo(currentX1, line.originalY1);
                linesPath.lineTo(currentX2, line.originalY2);
            });

            ctx.strokeStyle = '#E5FFAB';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.stroke(linesPath);

            if (latest >= 0.995) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const finalPath = new Path2D();
                linesRef.current.forEach((line) => {
                    finalPath.moveTo(line.originalX1, line.originalY1);
                    finalPath.lineTo(line.originalX2, line.originalY2);
                });
                ctx.strokeStyle = '#E5FFAB';
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.stroke(finalPath);

                setInitialAnimationComplete(true);
            }
        });

        animationProgress.set(1);

        return () => {
            unsubscribe();
        };
    }, [fontLoaded, initialAnimationComplete, animationProgress, smoothProgress, isInViewport]);

    return { initialAnimationComplete, canvasRef };
};

// Хук для отслеживания viewport visibility
const useViewportVisibility = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
    const [isInViewport, setIsInViewport] = useState(true);
    const exitProgress = useMotionValue(0);
    const smoothExitProgress = useSpring(exitProgress, {
        stiffness: 60,
        damping: 20,
        mass: 0.8,
    });

    // Opacity на основе exitProgress: 1 при 0, 0 при 1
    const opacity = useTransform(smoothExitProgress, [0, 0.8, 1], [1, 0.3, 0]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                const ratio = entry.intersectionRatio;
                const isVisible = entry.isIntersecting && ratio > 0.05;

                setIsInViewport(isVisible);
                exitProgress.set(1 - ratio);
            },
            {
                threshold: INTERSECTION_THRESHOLDS,
                rootMargin: '-100px 0px 0px 0px',
            }
        );

        observer.observe(canvas);

        return () => observer.disconnect();
    }, [exitProgress, canvasRef]);

    return { isInViewport, exitProgress: smoothExitProgress, opacity };
};

const MorphingWord: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [morphTarget, setMorphTarget] = useState(false);
    const timerProgressRef = useRef(0);

    const [prefersReducedMotion] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
    );

    const morphProgress = useMotionValue(0);
    const smoothMorphProgress = useSpring(morphProgress, {
        stiffness: prefersReducedMotion ? 100 : 40,
        damping: prefersReducedMotion ? 30 : 25,
        mass: prefersReducedMotion ? 0.5 : 1.2,
    });

    const fontLoaded = useFontLoader();
    const linesRef = useLineInitialization(fontLoaded);

    // Viewport tracking
    const { isInViewport, exitProgress, opacity } = useViewportVisibility(canvasRef);

    const { initialAnimationComplete, canvasRef: initialCanvasRef } = useInitialAnimation(
        fontLoaded,
        linesRef,
        isInViewport
    );

    // Связываем рефы
    useEffect(() => {
        initialCanvasRef.current = canvasRef.current;
    }, [initialCanvasRef]);

    // Таймер морфинга — останавливается когда не в viewport
    useEffect(() => {
        if (!initialAnimationComplete || !isInViewport) return;

        let startTime = Date.now();
        let pausedTime = 0;
        let isPaused = false;

        timerProgressRef.current = 0;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                isPaused = true;
                pausedTime = Date.now();
            } else {
                if (isPaused) {
                    const pauseDuration = Date.now() - pausedTime;
                    startTime += pauseDuration;
                    isPaused = false;
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        const updateTimer = () => {
            if (isPaused) return;

            const elapsed = Date.now() - startTime;
            timerProgressRef.current = Math.min(elapsed / MORPH_DURATION, 1);

            if (elapsed >= MORPH_DURATION) {
                setMorphTarget((prev) => !prev);
                startTime = Date.now();
                timerProgressRef.current = 0;
            }
        };

        const interval = setInterval(updateTimer, 16);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [initialAnimationComplete, morphTarget, isInViewport]);

    // Обновляем целевое значение морфинга
    useEffect(() => {
        morphProgress.set(morphTarget ? 1 : 0);
    }, [morphTarget, morphProgress]);

    // Основная анимация — полностью останавливается когда не в viewport
    useEffect(() => {
        if (!fontLoaded || linesRef.current.length === 0 || !initialAnimationComplete) return;

        // Критично: не запускаем RAF если не в viewport
        if (!isInViewport) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', {
            alpha: true,
            desynchronized: true,
            willReadFrequently: false,
        });
        if (!ctx) return;

        let rafId: number | null = null;
        let lastMorphProgress = 0;
        let lastExitProgress = 0;
        let isPageVisible = !document.hidden;

        // Gradient LUT
        const gradientLUT = new Map<number, string>();

        const getGradientColor = (position: number): string => {
            const lutKey = Math.round(position * 1000);

            if (gradientLUT.has(lutKey)) {
                return gradientLUT.get(lutKey)!;
            }

            const greenR = 229,
                greenG = 255,
                greenB = 171;
            const blueR = 107,
                blueG = 159,
                blueB = 255;

            const r = Math.round(greenR + (blueR - greenR) * position);
            const g = Math.round(greenG + (blueG - greenG) * position);
            const b = Math.round(greenB + (blueB - greenB) * position);

            const color = `rgb(${r}, ${g}, ${b})`;
            gradientLUT.set(lutKey, color);

            return color;
        };

        const getOptimizedLineColor = (lineY: number, currentMorphProgress: number): string => {
            const textStartY = 0;
            const textEndY = CANVAS_HEIGHT;
            const textHeight = textEndY - textStartY;

            const normalizedY = Math.max(0, Math.min(1, (lineY - textStartY) / textHeight));
            const timerProgress = timerProgressRef.current;
            const gradientZone = 0.2;

            const baseColor = '#E5FFAB';
            const fillColor = '#6B9FFF';

            const isSign = currentMorphProgress >= 0.5;

            if (isSign) {
                const invertedY = 1 - normalizedY;

                if (invertedY <= timerProgress - gradientZone) {
                    return fillColor;
                }

                if (invertedY <= timerProgress + gradientZone) {
                    const gradientPosition = (timerProgress + gradientZone - invertedY) / (gradientZone * 2);
                    const clampedPosition = Math.max(0, Math.min(1, gradientPosition));
                    return getGradientColor(clampedPosition);
                }
            } else {
                if (normalizedY <= timerProgress - gradientZone) {
                    return fillColor;
                }

                if (normalizedY <= timerProgress + gradientZone) {
                    const gradientPosition = (timerProgress + gradientZone - normalizedY) / (gradientZone * 2);
                    const clampedPosition = Math.max(0, Math.min(1, gradientPosition));
                    return getGradientColor(clampedPosition);
                }
            }

            return baseColor;
        };

        const render = (currentMorphProgress: number, currentExitProgress: number) => {
            if (!isPageVisible) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const colorGroups = new Map<
                string,
                Array<{ x1: number; y1: number; x2: number; y2: number; lineWidth: number }>
            >();

            linesRef.current.forEach((line, index) => {
                const lineDelay = (index / linesRef.current.length) * 0.15;
                const adjustedProgress = Math.max(0, Math.min(1, (currentMorphProgress - lineDelay) / (1 - lineDelay)));

                const eased =
                    adjustedProgress < 0.5
                        ? 4 * adjustedProgress * adjustedProgress * adjustedProgress
                        : 1 - Math.pow(-2 * adjustedProgress + 2, 3) / 2;

                const baseX1 = line.originalX1 + (line.signX1 - line.originalX1) * eased;
                const baseY1 = line.originalY1 + (line.signY1 - line.originalY1) * eased;
                const baseX2 = line.originalX2 + (line.signX2 - line.originalX2) * eased;
                const baseY2 = line.originalY2 + (line.signY2 - line.originalY2) * eased;

                const waveFactor = Math.sin(adjustedProgress * Math.PI);
                const waveOffset = waveFactor * 5 * (index % 2 === 0 ? 1 : -1);

                const spreadDirection = index % 2 === 0 ? -1 : 1;
                const spreadDistance = currentExitProgress * 800;
                const spreadEasing = currentExitProgress * currentExitProgress;
                const finalSpreadX = spreadDirection * spreadDistance * (1 + spreadEasing);

                line.x1 = baseX1 + finalSpreadX;
                line.y1 = baseY1 + waveOffset;
                line.x2 = baseX2 + finalSpreadX;
                line.y2 = baseY2 + waveOffset;

                const color = getOptimizedLineColor(baseY1, currentMorphProgress);

                const morphPhase = Math.sin(adjustedProgress * Math.PI);
                const dynamicLineWidth = 5 + morphPhase * 1.5;

                const roundedLineWidth = Math.round(dynamicLineWidth * 2) / 2;
                const groupKey = `${color}-${roundedLineWidth}`;

                if (!colorGroups.has(groupKey)) {
                    colorGroups.set(groupKey, []);
                }

                colorGroups.get(groupKey)!.push({
                    x1: line.x1,
                    y1: line.y1,
                    x2: line.x2,
                    y2: line.y2,
                    lineWidth: roundedLineWidth,
                });
            });

            colorGroups.forEach((lines, groupKey) => {
                const [color, lineWidthStr] = groupKey.split('-');
                const lineWidth = parseFloat(lineWidthStr);

                const path = new Path2D();
                lines.forEach(({ x1, y1, x2, y2 }) => {
                    path.moveTo(x1, y1);
                    path.lineTo(x2, y2);
                });

                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
                ctx.stroke(path);
            });
        };

        const handleVisibilityChange = () => {
            isPageVisible = !document.hidden;

            if (isPageVisible) {
                if (!rafId) {
                    rafId = requestAnimationFrame(animate);
                }
            } else {
                if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        const unsubscribeMorph = smoothMorphProgress.on('change', (currentMorphProgress) => {
            lastMorphProgress = currentMorphProgress;
        });

        const unsubscribeExit = exitProgress.on('change', (currentExitProgress) => {
            lastExitProgress = currentExitProgress;
        });

        const animate = () => {
            if (isPageVisible) {
                render(lastMorphProgress, lastExitProgress);
                rafId = requestAnimationFrame(animate);
            }
        };

        if (isPageVisible) {
            rafId = requestAnimationFrame(animate);
        }

        return () => {
            unsubscribeMorph();
            unsubscribeExit();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
        };
    }, [fontLoaded, initialAnimationComplete, smoothMorphProgress, exitProgress, isInViewport]);

    return (
        <motion.canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="morphing-word"
            style={{ touchAction: 'pan-y', opacity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        />
    );
};

export default React.memo(MorphingWord);
