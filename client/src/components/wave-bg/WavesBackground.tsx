import { memo, useEffect, useRef, useState } from 'react';
import { useAnimationMode } from '@/context/AnimationModeContext';
import {
    WAVE_SPEED_MULTIPLIER,
    type WaveConfig,
    wavesConfig,
} from '@/components/wave-bg/wavesConfig';

// =====================================================
// ОПТИМИЗАЦИЯ 1: Throttling для mousemove
// =====================================================
const throttle = <T extends (...args: never[]) => unknown>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle = false;

    return (...args: Parameters<T>): void => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
};

const useMousePosition = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
    const mousePos = useRef({ x: -1000, y: -1000 });
    const rectRef = useRef<DOMRect | null>(null);
    const { isSavingMode } = useAnimationMode();
    const isSavingModeRef = useRef(isSavingMode);
    isSavingModeRef.current = isSavingMode;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const updateRect = () => {
            rectRef.current = canvas.getBoundingClientRect();
        };
        updateRect();

        const handleMouseMove = (e: MouseEvent) => {
            if (isSavingModeRef.current) return;
            const rect = rectRef.current;
            if (!rect) return;
            mousePos.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        // ОПТИМИЗАЦИЯ: throttle до 16ms (~60fps)
        const throttledMouseMove = throttle(handleMouseMove, 16);

        window.addEventListener('resize', updateRect, { passive: true });
        document.addEventListener('mousemove', throttledMouseMove as EventListener);

        return () => {
            window.removeEventListener('resize', updateRect);
            document.removeEventListener('mousemove', throttledMouseMove as EventListener);
        };
    }, [canvasRef]);

    return mousePos;
};

const useCanvasResize = (
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    dprRef: React.MutableRefObject<number>
) => {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            dprRef.current = dpr;
            const cssW = canvas.offsetWidth;
            const cssH = canvas.offsetHeight;
            canvas.width = cssW * dpr;
            canvas.height = cssH * dpr;
            canvas.style.width = `${cssW}px`;
            canvas.style.height = `${cssH}px`;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        resizeCanvas();

        // ОПТИМИЗАЦИЯ: debounce для resize
        let resizeTimeout: ReturnType<typeof setTimeout>;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(resizeCanvas, 100);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimeout);
        };
    }, [canvasRef, dprRef]);
};

const modifyColor = (color: string, bright: number, glow: number): string => {
    const rgba = color.match(/[\d.]+/g);
    if (!rgba) return color;

    let r = parseFloat(rgba[0]);
    let g = parseFloat(rgba[1]);
    let b = parseFloat(rgba[2]);
    const a = parseFloat(rgba[3]);

    r = Math.min(255, r * bright + glow * 40);
    g = Math.min(255, g * bright + glow * 25);
    b = Math.min(255, b * bright + glow * 5);

    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
};

const smoothstep = (t: number): number => t * t * (3 - 2 * t);

const getWidthMultiplier = (shapeType: number, progress: number): number => {
    switch (shapeType) {
        case 0:
            return 0.05 + 1.2 * Math.sin(progress * Math.PI) ** 1.5;
        case 1:
            return 0.03 + 1.4 * Math.sin(progress * Math.PI) ** 2.5;
        case 2:
            return 1.3 - 1.1 * Math.sin(progress * Math.PI) ** 1.5;
        case 3:
            return 0.03 + 1.3 * smoothstep(smoothstep(progress));
        case 4:
            return 1.3 - 1.27 * smoothstep(smoothstep(progress));
        case 5:
            return 0.1 + 1.1 * Math.abs(Math.sin(progress * Math.PI * 3)) ** 1.8;
        case 6:
            return 0.05 + 1.3 * Math.sin(smoothstep(progress ** 0.4) * Math.PI) ** 1.5;
        case 7:
            return 0.05 + 1.3 * Math.sin(smoothstep(progress ** 2.2) * Math.PI) ** 1.5;
        default:
            return 1;
    }
};

// =====================================================
// ОПТИМИЗАЦИЯ 2: Кэш для градиентов
// =====================================================
class GradientCache {
    private cache = new Map<string, CanvasGradient>();

    get(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        color1: string,
        color2: string
    ): CanvasGradient {
        const key = `${width}:${height}:${color1}:${color2}`;

        if (!this.cache.has(key)) {
            if (this.cache.size >= 50) this.cache.clear();
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);
            this.cache.set(key, gradient);
        }

        return this.cache.get(key)!;
    }

    clear() {
        this.cache.clear();
    }
}

const WavesBackground = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dprRef = useRef(1);
    const mousePos = useMousePosition(canvasRef);

    useCanvasResize(canvasRef, dprRef);

    const [randomOffsets] = useState(() => wavesConfig.map(() => Math.random() * Math.PI * 2));

    const mouseInfluenceStrength = useRef(0);
    const smoothMousePos = useRef({ x: -1000, y: -1000 });
    const speedMultiplier = WAVE_SPEED_MULTIPLIER / 10;

    // НОВОЕ: Для плавного сброса времени
    const timeResetProgress = useRef(0);
    const isResettingTime = useRef(false);
    const timeBeforeReset = useRef(0);

    // ОПТИМИЗАЦИЯ 3: Кэш градиентов
    const gradientCache = useRef(new GradientCache());

    // ОПТИМИЗАЦИЯ 4: Pre-allocated typed arrays для точек (нет GC в hot path)
    // 2048 точек × 2 координаты — хватает для любого разрешения при step=5
    const pointsPool = useRef<{
        topBuf: Float32Array;
        bottomBuf: Float32Array;
    }>({
        topBuf: new Float32Array(2048 * 2),
        bottomBuf: new Float32Array(2048 * 2),
    });

    const drawWave = (
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        wave: WaveConfig,
        baseYOffset: number,
        waveIndex: number,
        time: number,
        rotatedMouseX: number,
        rotatedMouseY: number,
        isMouseInsideCanvas: boolean,
        currentMouseInfluence: number
    ) => {
        const waveTime = time + randomOffsets[waveIndex];
        const baseSpeed = wave.speed * speedMultiplier;

        const verticalOffset =
            Math.sin(waveTime * 0.005 * speedMultiplier + waveIndex * 0.5) *
            wave.verticalSpeed *
            20;
        const yOffset = baseYOffset + verticalOffset;

        const amplitudeVariation =
            Math.sin(waveTime * 0.003 * speedMultiplier + waveIndex * 0.3) * 0.3;
        const liveAmplitude = wave.amplitude * (1 + amplitudeVariation);

        const frequencyVariation =
            Math.sin(waveTime * 0.004 * speedMultiplier + waveIndex * 0.7) * 0.15;
        const liveFrequency = wave.frequency * (1 + frequencyVariation);

        const widthVariation = Math.sin(waveTime * 0.006 * speedMultiplier + waveIndex * 0.4) * 0.2;
        const baseWidth = wave.lineWidth * (1 + widthVariation);

        const cssW = canvas.width / dprRef.current;
        const cssH = canvas.height / dprRef.current;
        const extendedWidth = cssW * 1.5;
        const startX = -cssW * 0.25;

        const shapeType = waveIndex % 8;
        const secondaryShapeType = (waveIndex + 1) % 8;
        const shapeTransition = (Math.sin(waveTime * 0.002 * speedMultiplier + waveIndex) + 1) / 2;

        // ОПТИМИЗАЦИЯ 5: Typed arrays без аллокаций в hot path
        const topBuf = pointsPool.current.topBuf;
        const bottomBuf = pointsPool.current.bottomBuf;
        let ptCount = 0;

        // ОПТИМИЗАЦИЯ 6: Увеличиваем step с 3 до 5 (меньше итераций)
        const step = 5;

        // ОПТИМИЗАЦИЯ 7: Предрасчёт констант
        const maxMouseInfluenceRadius = 300 * currentMouseInfluence;
        const maxColorInfluenceRadius = 150 * currentMouseInfluence;
        const waveY = cssH / 2 + yOffset;

        for (let x = startX; x < extendedWidth; x += step) {
            const progress = (x - startX) / (extendedWidth - startX);

            const widthMultiplier1 = getWidthMultiplier(shapeType, progress);
            const widthMultiplier2 = getWidthMultiplier(secondaryShapeType, progress);
            const widthMultiplier =
                widthMultiplier1 * (1 - shapeTransition) + widthMultiplier2 * shapeTransition;

            const localDeformation =
                Math.sin(progress * Math.PI * 8 + waveTime * 0.01 * speedMultiplier + waveIndex) *
                0.1;
            const finalWidthMultiplier = widthMultiplier * (1 + localDeformation);
            const currentWidth = (baseWidth * finalWidthMultiplier) / 2;

            const primaryWave = Math.sin(x * liveFrequency + wave.phase + waveTime * baseSpeed);
            const secondaryWave =
                Math.sin(x * liveFrequency * 1.5 + waveTime * baseSpeed * 0.7) * 0.3;

            const morphNode1 =
                Math.sin(progress * Math.PI * 3 - waveTime * 0.004 * speedMultiplier + waveIndex) *
                liveAmplitude *
                0.4;
            const morphNode2 =
                Math.sin(
                    progress * Math.PI * 5 + waveTime * 0.006 * speedMultiplier - waveIndex * 0.5
                ) *
                liveAmplitude *
                0.25;
            const morphNode3 =
                Math.sin(
                    progress * Math.PI * 7 - waveTime * 0.005 * speedMultiplier + waveIndex * 1.2
                ) *
                liveAmplitude *
                0.15;
            const localPulse =
                Math.sin(progress * Math.PI * 4 + waveTime * 0.008 * speedMultiplier) * 0.2 + 1;

            // ОПТИМИЗАЦИЯ 8: Избегаем Math.sqrt если возможно
            const distanceFromMouseX = x - rotatedMouseX;
            const distanceFromMouseY = waveY - rotatedMouseY;
            const totalDistanceSq =
                distanceFromMouseX * distanceFromMouseX + distanceFromMouseY * distanceFromMouseY;
            const mouseInfluenceRadiusSq = maxMouseInfluenceRadius * maxMouseInfluenceRadius;

            let mouseDeformation = 0;

            if (totalDistanceSq < mouseInfluenceRadiusSq && maxMouseInfluenceRadius > 0) {
                const totalDistance = Math.sqrt(totalDistanceSq);
                const influenceStrength = 1 - totalDistance / maxMouseInfluenceRadius;
                const deformationPattern =
                    Math.sin(influenceStrength * Math.PI * 2) * influenceStrength;
                mouseDeformation = deformationPattern * liveAmplitude * 0.8;
            }

            const centerY =
                cssH / 2 +
                yOffset +
                (primaryWave + secondaryWave) * liveAmplitude * localPulse +
                morphNode1 +
                morphNode2 +
                morphNode3 +
                mouseDeformation;

            const i2 = ptCount * 2;
            topBuf[i2] = x;
            topBuf[i2 + 1] = centerY - currentWidth;
            bottomBuf[i2] = x;
            bottomBuf[i2 + 1] = centerY + currentWidth;
            ptCount++;
        }

        ctx.beginPath();

        ctx.moveTo(topBuf[0], topBuf[1]);
        for (let i = 1; i < ptCount; i++) {
            ctx.lineTo(topBuf[i * 2], topBuf[i * 2 + 1]);
        }

        for (let i = ptCount - 1; i >= 0; i--) {
            ctx.lineTo(bottomBuf[i * 2], bottomBuf[i * 2 + 1]);
        }

        ctx.closePath();

        const waveCenterY = cssH / 2 + yOffset;
        const distToMouse = Math.abs(waveCenterY - rotatedMouseY);

        let brightness = 1;
        let glowAmount = 0;

        if (
            distToMouse < maxColorInfluenceRadius &&
            maxColorInfluenceRadius > 0 &&
            isMouseInsideCanvas
        ) {
            const strength = 1 - distToMouse / maxColorInfluenceRadius;
            brightness = 1 + strength * 0.8;
            glowAmount = strength * 0.6;
        }

        const color1 = modifyColor(wave.gradientColors[0], brightness, glowAmount);
        const color2 = modifyColor(wave.gradientColors[1], brightness, glowAmount);

        // ОПТИМИЗАЦИЯ 9: Используем кэш градиентов
        const gradient = gradientCache.current.get(ctx, cssW, cssH, color1, color2);

        if (glowAmount > 0.5) {
            const shadowColor = color1.replace(/[\d.]+\)$/, '0.6)');
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = glowAmount * 40;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.shadowBlur = 0;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', {
            // ОПТИМИЗАЦИЯ 10: Настройки контекста для лучшей производительности
            desynchronized: true, // Асинхронная отрисовка
        });
        if (!ctx) return;

        const waves = wavesConfig;
        let animationId: ReturnType<typeof requestAnimationFrame>;
        let time = 0;
        let lastFrameTime = performance.now();

        // ОПТИМИЗАЦИЯ 11: FPS лимитер
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;
        let lastDrawTime = 0;

        const IDLE_TIMEOUT_BG = 30_000;
        let lastActivityBg = performance.now();
        let idlePausedBg = false;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                cancelAnimationFrame(animationId);
                // Очищаем кэш при скрытии вкладки
                gradientCache.current.clear();
            } else {
                lastFrameTime = performance.now();
                lastActivityBg = performance.now();
                idlePausedBg = false;
                mouseInfluenceStrength.current = 0;
                smoothMousePos.current = { x: -1000, y: -1000 };
                // Сбрасываем состояние сброса времени
                isResettingTime.current = false;
                timeResetProgress.current = 0;
                animate();
            }
        };

        const animate = () => {
            if (!ctx || !canvas) return;

            if (performance.now() - lastActivityBg > IDLE_TIMEOUT_BG) {
                idlePausedBg = true;
                cancelAnimationFrame(animationId);
                return;
            }
            idlePausedBg = false;

            const currentTime = performance.now();

            // ОПТИМИЗАЦИЯ 12: Ограничение FPS
            if (currentTime - lastDrawTime < frameInterval) {
                animationId = requestAnimationFrame(animate);
                return;
            }

            const deltaTime = currentTime - lastFrameTime;
            lastFrameTime = currentTime;
            lastDrawTime = currentTime;

            const cappedDelta = Math.min(deltaTime, 100);

            const dpr = dprRef.current;
            const cssW = canvas.width / dpr;
            const cssH = canvas.height / dpr;

            ctx.clearRect(0, 0, cssW, cssH);

            const centerX = cssW / 2;
            const centerY = cssH / 2;

            const isMouseInsideCanvas =
                mousePos.current.x >= 0 &&
                mousePos.current.y >= 0 &&
                mousePos.current.x <= cssW &&
                mousePos.current.y <= cssH;

            const mouseLerpSpeed = isMouseInsideCanvas ? 0.15 : 0.08;
            smoothMousePos.current.x +=
                (mousePos.current.x - smoothMousePos.current.x) * mouseLerpSpeed;
            smoothMousePos.current.y +=
                (mousePos.current.y - smoothMousePos.current.y) * mouseLerpSpeed;

            const rotatedMouseX =
                centerX +
                (smoothMousePos.current.x - centerX) * Math.cos(-Math.PI / 4) -
                (smoothMousePos.current.y - centerY) * Math.sin(-Math.PI / 4);
            const rotatedMouseY =
                centerY +
                (smoothMousePos.current.x - centerX) * Math.sin(-Math.PI / 4) +
                (smoothMousePos.current.y - centerY) * Math.cos(-Math.PI / 4);

            const targetInfluence = isMouseInsideCanvas ? 1 : 0;
            const influenceLerpSpeed = 0.05;
            mouseInfluenceStrength.current +=
                (targetInfluence - mouseInfluenceStrength.current) * influenceLerpSpeed;

            // ИСПРАВЛЕНИЕ: Плавный сброс времени
            let effectiveTime = time;

            // Начинаем процесс сброса, когда время достигает порога
            if (time > 3600 && !isResettingTime.current) {
                isResettingTime.current = true;
                timeBeforeReset.current = time;
                timeResetProgress.current = 0;
            }

            // Плавный переход от старого значения к новому (0)
            if (isResettingTime.current) {
                timeResetProgress.current += 0.02; // Скорость перехода (за ~50 кадров = ~0.8сек)

                if (timeResetProgress.current >= 1) {
                    // Переход завершён
                    time = 0;
                    isResettingTime.current = false;
                    timeResetProgress.current = 0;
                    effectiveTime = 0;
                } else {
                    // Плавная интерполяция с easing (smoothstep)
                    const easeProgress =
                        timeResetProgress.current *
                        timeResetProgress.current *
                        (3 - 2 * timeResetProgress.current);
                    effectiveTime = timeBeforeReset.current * (1 - easeProgress);
                }
            }

            ctx.save();
            ctx.translate(cssW / 2, cssH / 2);
            ctx.rotate(Math.PI / 4);
            ctx.translate(-cssW / 2, -cssH / 2);

            waves.forEach((wave, waveIndex) => {
                const dynamicSpacing =
                    110 +
                    Math.sin(
                        effectiveTime * 0.0025 * speedMultiplier +
                            waveIndex +
                            randomOffsets[waveIndex]
                    ) *
                        70;
                const yOffset = (waveIndex - waves.length / 2) * dynamicSpacing;
                drawWave(
                    ctx,
                    canvas,
                    wave,
                    yOffset,
                    waveIndex,
                    effectiveTime,
                    rotatedMouseX,
                    rotatedMouseY,
                    isMouseInsideCanvas,
                    mouseInfluenceStrength.current
                );
            });

            ctx.restore();

            // Обновляем время только если не в процессе сброса
            if (!isResettingTime.current) {
                time += cappedDelta / 16.67;
            }

            animationId = requestAnimationFrame(animate);
        };

        const onActivityBg = () => {
            lastActivityBg = performance.now();
            if (idlePausedBg) {
                idlePausedBg = false;
                lastFrameTime = performance.now();
                animationId = requestAnimationFrame(animate);
            }
        };

        animate();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('mousemove', onActivityBg, { passive: true });

        return () => {
            cancelAnimationFrame(animationId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('mousemove', onActivityBg);
            gradientCache.current.clear(); // Очищаем кэш при размонтировании
        };
    }, [randomOffsets, speedMultiplier]);

    return <canvas ref={canvasRef} className="waves-canvas waves-canvas--bg"></canvas>;
});

export default WavesBackground;
