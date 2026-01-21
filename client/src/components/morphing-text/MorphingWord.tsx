import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
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
const MORPH_DURATION = 5000; // 5 секунд

const createTextCanvas = (text: string, x: number, y: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH + 400;
    canvas.height = CANVAS_HEIGHT + 100;

    const ctx = canvas.getContext('2d', {
        alpha: true,
        willReadFrequently: true // Мы читаем imageData
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

const useInitialAnimation = (fontLoaded: boolean, linesRef: React.MutableRefObject<Line[]>) => {
    const [initialAnimationComplete, setInitialAnimationComplete] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationProgress = useMotionValue(0);
    const smoothProgress = useSpring(animationProgress, {
        stiffness: 50,
        damping: 20,
        mass: 1
    });

    useEffect(() => {
        if (!fontLoaded || linesRef.current.length === 0 || initialAnimationComplete) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', {
            alpha: true,
            desynchronized: true,
            willReadFrequently: false
        });
        if (!ctx) return;

        const unsubscribe = smoothProgress.on('change', (latest) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const linesPath = new Path2D();
            linesRef.current.forEach((line, index) => {
                const direction = index % 2 === 0 ? 1 : -1;

                // Используем latest напрямую, без дополнительных преобразований
                const currentX1 = line.originalX1 - (direction * 800 * (1 - latest));
                const currentX2 = line.originalX2 - (direction * 800 * (1 - latest));

                linesPath.moveTo(currentX1, line.originalY1);
                linesPath.lineTo(currentX2, line.originalY2);
            });

            ctx.strokeStyle = '#E5FFAB';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.stroke(linesPath);

            // Завершаем анимацию только когда progress достаточно близок к 1
            if (latest >= 0.995) {
                // Финальный рендер с точными позициями
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

        // Запускаем анимацию
        animationProgress.set(1);

        return () => {
            unsubscribe();
        };
    }, [fontLoaded, initialAnimationComplete, animationProgress, smoothProgress]);

    return { initialAnimationComplete, canvasRef };
};

const MorphingWord: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [morphTarget, setMorphTarget] = useState(false);
    const timerProgressRef = useRef(0); // Прогресс таймера от 0 до 1

    // Проверяем prefers-reduced-motion один раз при инициализации
    const [prefersReducedMotion] = useState(() =>
        typeof window !== 'undefined'
            ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
            : false
    );

    // Используем Framer Motion для плавного морфинга
    const morphProgress = useMotionValue(0);
    const smoothMorphProgress = useSpring(morphProgress, {
        stiffness: prefersReducedMotion ? 100 : 40,
        damping: prefersReducedMotion ? 30 : 25,
        mass: prefersReducedMotion ? 0.5 : 1.2
    });

    // Прогресс анимации выхода из viewport (0 = полностью виден, 1 = полностью скрыт)
    const exitProgress = useMotionValue(0);
    const smoothExitProgress = useSpring(exitProgress, {
        stiffness: 60,
        damping: 20,
        mass: 0.8
    });

    const fontLoaded = useFontLoader();
    const linesRef = useLineInitialization(fontLoaded);
    const { initialAnimationComplete, canvasRef: initialCanvasRef } = useInitialAnimation(fontLoaded, linesRef);

    // Связываем рефы
    useEffect(() => {
        initialCanvasRef.current = canvasRef.current;
    }, []);

    // Отслеживаем видимость компонента через Intersection Observer
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // entry.intersectionRatio: 0 = полностью скрыт, 1 = полностью виден
                const ratio = entry.intersectionRatio;

                // Обновляем прогресс выхода (инвертируем: 1 = виден, 0 = скрыт)
                exitProgress.set(1 - ratio);
            },
            {
                threshold: Array.from({ length: 101 }, (_, i) => i / 100), // 0, 0.01, 0.02 ... 1.0
                rootMargin: '-100px 0px 0px 0px' // Начинаем анимацию на 100px раньше
            }
        );

        observer.observe(canvas);

        return () => {
            observer.disconnect();
        };
    }, [exitProgress]);

    // Автоматическое переключение каждые MORPH_DURATION секунд с отслеживанием прогресса
    useEffect(() => {
        if (!initialAnimationComplete) return;

        let startTime = Date.now();
        let pausedTime = 0;
        let isPaused = false;

        // Инициализируем таймер с 0, чтобы анимация начиналась сразу
        timerProgressRef.current = 0;

        // Обработчик изменения видимости страницы
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Страница скрыта - ставим на паузу
                isPaused = true;
                pausedTime = Date.now();
            } else {
                // Страница видима - возобновляем
                if (isPaused) {
                    const pauseDuration = Date.now() - pausedTime;
                    startTime += pauseDuration; // Компенсируем время паузы
                    isPaused = false;
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        const updateTimer = () => {
            if (isPaused) return; // Не обновляем таймер если на паузе

            const elapsed = Date.now() - startTime;
            timerProgressRef.current = Math.min(elapsed / MORPH_DURATION, 1);

            if (elapsed >= MORPH_DURATION) {
                setMorphTarget(prev => !prev);
                startTime = Date.now();
                timerProgressRef.current = 0;
            }
        };

        const interval = setInterval(updateTimer, 16); // ~60fps

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [initialAnimationComplete, morphTarget]);

    // Обновляем целевое значение морфинга
    useEffect(() => {
        morphProgress.set(morphTarget ? 1 : 0);
    }, [morphTarget, morphProgress]);

    // Анимация морфинга с волновым эффектом
    useEffect(() => {
        if (!fontLoaded || linesRef.current.length === 0 || !initialAnimationComplete) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', {
            alpha: true,
            desynchronized: true,
            willReadFrequently: false
        });
        if (!ctx) return;

        let rafId: number | null = null;
        let lastMorphProgress = 0;
        let lastExitProgress = 0;
        let isPageVisible = !document.hidden;

        // Создаём lookup table для градиента (предвычисляем все цвета)
        // Это даёт плавность без пересчёта RGB на каждом кадре
        const gradientLUT = new Map<number, string>();

        const getGradientColor = (position: number): string => {
            // position от 0 до 1, где 0 = зелёный, 1 = синий
            const lutKey = Math.round(position * 1000); // 1000 уникальных цветов в градиенте

            if (gradientLUT.has(lutKey)) {
                return gradientLUT.get(lutKey)!;
            }

            // Вычисляем цвет только один раз для каждой позиции
            const greenR = 229, greenG = 255, greenB = 171;
            const blueR = 107, blueG = 159, blueB = 255;

            const r = Math.round(greenR + (blueR - greenR) * position);
            const g = Math.round(greenG + (blueG - greenG) * position);
            const b = Math.round(greenB + (blueB - greenB) * position);

            const color = `rgb(${r}, ${g}, ${b})`;
            gradientLUT.set(lutKey, color);

            return color;
        };

        // Оптимизированная функция получения цвета с использованием LUT
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

            // Группируем линии по цвету для батчинга
            const colorGroups = new Map<string, Array<{x1: number, y1: number, x2: number, y2: number, lineWidth: number}>>();

            linesRef.current.forEach((line, index) => {
                // Базовый морфинг с индивидуальной задержкой для волнового эффекта
                const lineDelay = (index / linesRef.current.length) * 0.15;
                const adjustedProgress = Math.max(0, Math.min(1,
                    (currentMorphProgress - lineDelay) / (1 - lineDelay)
                ));

                // Применяем easing для более органичного движения
                const eased = adjustedProgress < 0.5
                    ? 4 * adjustedProgress * adjustedProgress * adjustedProgress
                    : 1 - Math.pow(-2 * adjustedProgress + 2, 3) / 2;

                const baseX1 = line.originalX1 + (line.signX1 - line.originalX1) * eased;
                const baseY1 = line.originalY1 + (line.signY1 - line.originalY1) * eased;
                const baseX2 = line.originalX2 + (line.signX2 - line.originalX2) * eased;
                const baseY2 = line.originalY2 + (line.signY2 - line.originalY2) * eased;

                // Добавляем небольшое волнообразное движение во время перехода
                const waveFactor = Math.sin(adjustedProgress * Math.PI);
                const waveOffset = waveFactor * 5 * (index % 2 === 0 ? 1 : -1);

                // Применяем анимацию разлёта линий при выходе из viewport
                // Чётные индексы летят влево, нечётные вправо
                const spreadDirection = index % 2 === 0 ? -1 : 1;
                const spreadDistance = currentExitProgress * 800; // Максимум 800px разлёта

                // Добавляем эффект ускорения при разлёте
                const spreadEasing = currentExitProgress * currentExitProgress; // Quadratic easing
                const finalSpreadX = spreadDirection * spreadDistance * (1 + spreadEasing);

                // Обновляем позиции линий
                line.x1 = baseX1 + finalSpreadX;
                line.y1 = baseY1 + waveOffset;
                line.x2 = baseX2 + finalSpreadX;
                line.y2 = baseY2 + waveOffset;

                // Получаем цвет
                const color = getOptimizedLineColor(baseY1, currentMorphProgress);

                // Динамическое изменение толщины линий во время морфинга
                const morphPhase = Math.sin(adjustedProgress * Math.PI);
                const dynamicLineWidth = 5 + morphPhase * 1.5;

                // Группируем по цвету (округляем lineWidth для лучшего батчинга)
                const roundedLineWidth = Math.round(dynamicLineWidth * 2) / 2; // 0.5px precision
                const groupKey = `${color}-${roundedLineWidth}`;

                if (!colorGroups.has(groupKey)) {
                    colorGroups.set(groupKey, []);
                }

                colorGroups.get(groupKey)!.push({
                    x1: line.x1,
                    y1: line.y1,
                    x2: line.x2,
                    y2: line.y2,
                    lineWidth: roundedLineWidth
                });
            });

            // Рендерим сгруппированные линии
            colorGroups.forEach((lines, groupKey) => {
                const [color, lineWidthStr] = groupKey.split('-');
                const lineWidth = parseFloat(lineWidthStr);

                const path = new Path2D();
                lines.forEach(({x1, y1, x2, y2}) => {
                    path.moveTo(x1, y1);
                    path.lineTo(x2, y2);
                });

                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
                ctx.stroke(path);
            });
        };

        // Обработчик видимости страницы
        const handleVisibilityChange = () => {
            isPageVisible = !document.hidden;

            if (isPageVisible) {
                // Страница стала видимой - возобновляем рендеринг
                if (!rafId) {
                    rafId = requestAnimationFrame(animate);
                }
            } else {
                // Страница скрыта - останавливаем рендеринг
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

        const unsubscribeExit = smoothExitProgress.on('change', (currentExitProgress) => {
            lastExitProgress = currentExitProgress;
        });

        // Постоянная перерисовка для обновления цветов таймера и анимации разлёта
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
    }, [fontLoaded, initialAnimationComplete, smoothMorphProgress, smoothExitProgress]);

    return (
        <motion.canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="morphing-word"
            style={{ touchAction: 'pan-y' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        />
    );
};

export default React.memo(MorphingWord);