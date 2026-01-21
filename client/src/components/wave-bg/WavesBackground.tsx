import { useEffect, useRef, useMemo, useState } from 'react';
import { wavesConfig, type WaveConfig, WAVE_SPEED_MULTIPLIER } from 'client/src/components/wave-bg/wavesConfig.ts';

// =====================================================
// ОПТИМИЗАЦИЯ 1: Throttling для mousemove
// =====================================================
const throttle = <T extends (...args: never[]) => unknown>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle = false;

    return function (...args: Parameters<T>): void {
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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mousePos.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        // ОПТИМИЗАЦИЯ: throttle до 16ms (~60fps)
        const throttledMouseMove = throttle(handleMouseMove, 16);

        document.addEventListener('mousemove', throttledMouseMove as EventListener);

        return () => {
            document.removeEventListener('mousemove', throttledMouseMove as EventListener);
        };
    }, [canvasRef]);

    return mousePos;
};

const useCanvasResize = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
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
    }, [canvasRef]);
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
            return 0.05 + 1.2 * Math.pow(Math.sin(progress * Math.PI), 1.5);
        case 1:
            return 0.03 + 1.4 * Math.pow(Math.sin(progress * Math.PI), 2.5);
        case 2:
            return 1.3 - 1.1 * Math.pow(Math.sin(progress * Math.PI), 1.5);
        case 3:
            return 0.03 + 1.3 * smoothstep(smoothstep(progress));
        case 4:
            return 1.3 - 1.27 * smoothstep(smoothstep(progress));
        case 5:
            return 0.1 + 1.1 * Math.pow(Math.abs(Math.sin(progress * Math.PI * 3)), 1.8);
        case 6:
            return 0.05 + 1.3 * Math.pow(Math.sin(smoothstep(Math.pow(progress, 0.4)) * Math.PI), 1.5);
        case 7:
            return 0.05 + 1.3 * Math.pow(Math.sin(smoothstep(Math.pow(progress, 2.2)) * Math.PI), 1.5);
        default:
            return 1;
    }
};

// =====================================================
// ОПТИМИЗАЦИЯ 2: Кэш для градиентов
// =====================================================
class GradientCache {
    private cache = new Map<string, CanvasGradient>();

    get(ctx: CanvasRenderingContext2D, width: number, height: number, color1: string, color2: string): CanvasGradient {
        const key = `${width}:${height}:${color1}:${color2}`;

        if (!this.cache.has(key)) {
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

const WavesBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mousePos = useMousePosition(canvasRef);

    useCanvasResize(canvasRef);

    const [randomOffsets] = useState(() => wavesConfig.map(() => Math.random() * Math.PI * 2));

    const mouseInfluenceStrength = useRef(0);
    const smoothMousePos = useRef({ x: -1000, y: -1000 });
    const speedMultiplier = useMemo(() => WAVE_SPEED_MULTIPLIER / 10, []);

    // НОВОЕ: Для плавного сброса времени
    const timeResetProgress = useRef(0);
    const isResettingTime = useRef(false);
    const timeBeforeReset = useRef(0);

    // ОПТИМИЗАЦИЯ 3: Кэш градиентов
    const gradientCache = useRef(new GradientCache());

    // ОПТИМИЗАЦИЯ 4: Переиспользуемые массивы точек
    const pointsPool = useRef<{
        topPoints: Array<{ x: number; y: number }>;
        bottomPoints: Array<{ x: number; y: number }>;
    }>({
        topPoints: [],
        bottomPoints: [],
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
        ctx.save();

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI / 4);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        const waveTime = time + randomOffsets[waveIndex];
        const baseSpeed = wave.speed * speedMultiplier;

        const verticalOffset = Math.sin(waveTime * 0.005 * speedMultiplier + waveIndex * 0.5) * wave.verticalSpeed * 20;
        const yOffset = baseYOffset + verticalOffset;

        const amplitudeVariation = Math.sin(waveTime * 0.003 * speedMultiplier + waveIndex * 0.3) * 0.3;
        const liveAmplitude = wave.amplitude * (1 + amplitudeVariation);

        const frequencyVariation = Math.sin(waveTime * 0.004 * speedMultiplier + waveIndex * 0.7) * 0.15;
        const liveFrequency = wave.frequency * (1 + frequencyVariation);

        const widthVariation = Math.sin(waveTime * 0.006 * speedMultiplier + waveIndex * 0.4) * 0.2;
        const baseWidth = wave.lineWidth * (1 + widthVariation);

        const extendedWidth = canvas.width * 1.5;
        const startX = -canvas.width * 0.25;

        const shapeType = waveIndex % 8;
        const secondaryShapeType = (waveIndex + 1) % 8;
        const shapeTransition = (Math.sin(waveTime * 0.002 * speedMultiplier + waveIndex) + 1) / 2;

        // ОПТИМИЗАЦИЯ 5: Переиспользуем массивы
        const topPoints = pointsPool.current.topPoints;
        const bottomPoints = pointsPool.current.bottomPoints;
        topPoints.length = 0;
        bottomPoints.length = 0;

        // ОПТИМИЗАЦИЯ 6: Увеличиваем step с 3 до 5 (меньше итераций)
        const step = 5;

        // ОПТИМИЗАЦИЯ 7: Предрасчёт констант
        const maxMouseInfluenceRadius = 300 * currentMouseInfluence;
        const maxColorInfluenceRadius = 150 * currentMouseInfluence;
        const waveY = canvas.height / 2 + yOffset;

        for (let x = startX; x < extendedWidth; x += step) {
            const progress = (x - startX) / (extendedWidth - startX);

            const widthMultiplier1 = getWidthMultiplier(shapeType, progress);
            const widthMultiplier2 = getWidthMultiplier(secondaryShapeType, progress);
            const widthMultiplier = widthMultiplier1 * (1 - shapeTransition) + widthMultiplier2 * shapeTransition;

            const localDeformation =
                Math.sin(progress * Math.PI * 8 + waveTime * 0.01 * speedMultiplier + waveIndex) * 0.1;
            const finalWidthMultiplier = widthMultiplier * (1 + localDeformation);
            const currentWidth = (baseWidth * finalWidthMultiplier) / 2;

            const primaryWave = Math.sin(x * liveFrequency + wave.phase + waveTime * baseSpeed);
            const secondaryWave = Math.sin(x * liveFrequency * 1.5 + waveTime * baseSpeed * 0.7) * 0.3;

            const morphNode1 =
                Math.sin(progress * Math.PI * 3 - waveTime * 0.004 * speedMultiplier + waveIndex) * liveAmplitude * 0.4;
            const morphNode2 =
                Math.sin(progress * Math.PI * 5 + waveTime * 0.006 * speedMultiplier - waveIndex * 0.5) *
                liveAmplitude *
                0.25;
            const morphNode3 =
                Math.sin(progress * Math.PI * 7 - waveTime * 0.005 * speedMultiplier + waveIndex * 1.2) *
                liveAmplitude *
                0.15;
            const localPulse = Math.sin(progress * Math.PI * 4 + waveTime * 0.008 * speedMultiplier) * 0.2 + 1;

            // ОПТИМИЗАЦИЯ 8: Избегаем Math.sqrt если возможно
            const distanceFromMouseX = x - rotatedMouseX;
            const distanceFromMouseY = waveY - rotatedMouseY;
            const totalDistanceSq = distanceFromMouseX * distanceFromMouseX + distanceFromMouseY * distanceFromMouseY;
            const mouseInfluenceRadiusSq = maxMouseInfluenceRadius * maxMouseInfluenceRadius;

            let mouseDeformation = 0;

            if (totalDistanceSq < mouseInfluenceRadiusSq && maxMouseInfluenceRadius > 0) {
                const totalDistance = Math.sqrt(totalDistanceSq);
                const influenceStrength = 1 - totalDistance / maxMouseInfluenceRadius;
                const deformationPattern = Math.sin(influenceStrength * Math.PI * 2) * influenceStrength;
                mouseDeformation = deformationPattern * liveAmplitude * 0.8;
            }

            const centerY =
                canvas.height / 2 +
                yOffset +
                (primaryWave + secondaryWave) * liveAmplitude * localPulse +
                morphNode1 +
                morphNode2 +
                morphNode3 +
                mouseDeformation;

            topPoints.push({ x, y: centerY - currentWidth });
            bottomPoints.push({ x, y: centerY + currentWidth });
        }

        ctx.beginPath();

        topPoints.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });

        for (let i = bottomPoints.length - 1; i >= 0; i--) {
            ctx.lineTo(bottomPoints[i].x, bottomPoints[i].y);
        }

        ctx.closePath();

        const waveCenterY = canvas.height / 2 + yOffset;
        const distToMouse = Math.abs(waveCenterY - rotatedMouseY);

        let brightness = 1;
        let glowAmount = 0;

        if (distToMouse < maxColorInfluenceRadius && maxColorInfluenceRadius > 0 && isMouseInsideCanvas) {
            const strength = 1 - distToMouse / maxColorInfluenceRadius;
            brightness = 1 + strength * 0.8;
            glowAmount = strength * 0.6;
        }

        const color1 = modifyColor(wave.gradientColors[0], brightness, glowAmount);
        const color2 = modifyColor(wave.gradientColors[1], brightness, glowAmount);

        // ОПТИМИЗАЦИЯ 9: Используем кэш градиентов
        const gradient = gradientCache.current.get(ctx, canvas.width, canvas.height, color1, color2);

        if (glowAmount > 0.1) {
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
        ctx.restore();
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
        let animationId: number;
        let time = 0;
        let lastFrameTime = performance.now();

        // ОПТИМИЗАЦИЯ 11: FPS лимитер
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;
        let lastDrawTime = 0;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                cancelAnimationFrame(animationId);
                // Очищаем кэш при скрытии вкладки
                gradientCache.current.clear();
            } else {
                lastFrameTime = performance.now();
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

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            const isMouseInsideCanvas =
                mousePos.current.x >= 0 &&
                mousePos.current.y >= 0 &&
                mousePos.current.x <= canvas.width &&
                mousePos.current.y <= canvas.height;

            const mouseLerpSpeed = isMouseInsideCanvas ? 0.15 : 0.08;
            smoothMousePos.current.x += (mousePos.current.x - smoothMousePos.current.x) * mouseLerpSpeed;
            smoothMousePos.current.y += (mousePos.current.y - smoothMousePos.current.y) * mouseLerpSpeed;

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
            mouseInfluenceStrength.current += (targetInfluence - mouseInfluenceStrength.current) * influenceLerpSpeed;

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
                        timeResetProgress.current * timeResetProgress.current * (3 - 2 * timeResetProgress.current);
                    effectiveTime = timeBeforeReset.current * (1 - easeProgress);
                }
            }

            waves.forEach((wave, waveIndex) => {
                const dynamicSpacing =
                    110 +
                    Math.sin(effectiveTime * 0.0025 * speedMultiplier + waveIndex + randomOffsets[waveIndex]) * 70;
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

            // Обновляем время только если не в процессе сброса
            if (!isResettingTime.current) {
                time += cappedDelta / 16.67;
            }

            animationId = requestAnimationFrame(animate);
        };

        animate();

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            cancelAnimationFrame(animationId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            gradientCache.current.clear(); // Очищаем кэш при размонтировании
        };
    }, [randomOffsets, speedMultiplier]);

    return <canvas ref={canvasRef} className="waves-canvas"></canvas>;
};

export default WavesBackground;
