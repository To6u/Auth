import { memo, useEffect, useRef } from 'react';
import {
    THIN_WAVE_SPEED_MULTIPLIER,
    type ThinWaveConfig,
    thinWavesConfig,
} from '@/components/wave-bg/thin-wave/thinWavesConfig.ts';

const ThinWavesBackground = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Логические размеры (CSS px) — используются во всём drawing-коде
        let logW = canvas.offsetWidth;
        let logH = canvas.offsetHeight;

        // Кеш градиентов — инвалидируется при resize
        let bgGradient: CanvasGradient | null = null;
        const waveGradients: (CanvasGradient | null)[] = new Array(thinWavesConfig.length).fill(
            null
        );

        const resizeCanvas = () => {
            const dpr = Math.min(devicePixelRatio, 2);
            logW = canvas.offsetWidth;
            logH = canvas.offsetHeight;
            canvas.width = logW * dpr;
            canvas.height = logH * dpr;
            ctx.scale(dpr, dpr);
            // Градиенты привязаны к размерам — инвалидируем
            bgGradient = null;
            waveGradients.fill(null);
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas, { passive: true });
        const ro = new ResizeObserver(resizeCanvas);
        ro.observe(canvas);

        const waves = thinWavesConfig;
        const speedMultiplier = THIN_WAVE_SPEED_MULTIPLIER / 10;

        let animationId: number;
        let time = 0;
        let isVisible = !document.hidden;
        const IDLE_TIMEOUT = 20_000;
        let lastActivity = performance.now();
        let idlePaused = false;

        const drawWave = (wave: ThinWaveConfig, baseYOffset: number, waveIndex: number) => {
            ctx.save();

            ctx.translate(logW / 2, logH / 2);
            ctx.rotate(Math.PI / 4);
            ctx.translate(-logW / 2, -logH / 2);

            const verticalOffset =
                Math.sin(time * 0.005 * speedMultiplier + waveIndex * 0.5) *
                wave.verticalSpeed *
                20;
            const yOffset = baseYOffset + verticalOffset;

            const amplitudeVariation =
                Math.sin(time * 0.003 * speedMultiplier + waveIndex * 0.3) * 0.3;
            const liveAmplitude = wave.amplitude * (1 + amplitudeVariation);

            const frequencyVariation =
                Math.sin(time * 0.004 * speedMultiplier + waveIndex * 0.7) * 0.15;
            const liveFrequency = wave.frequency * (1 + frequencyVariation);

            const widthVariation = Math.sin(time * 0.006 * speedMultiplier + waveIndex * 0.4) * 0.2;
            const liveWidth = wave.lineWidth * (1 + widthVariation);

            ctx.beginPath();

            const extendedWidth = logW * 1.5;
            const startX = -logW * 0.25;

            ctx.moveTo(startX, logH / 2 + yOffset);

            for (let x = startX; x < extendedWidth; x += 4) {
                const primaryWave = Math.sin(
                    x * liveFrequency + wave.phase + time * wave.speed * speedMultiplier
                );
                const secondaryWave =
                    Math.sin(x * liveFrequency * 1.5 + time * wave.speed * speedMultiplier * 0.7) *
                    0.3;

                const y = logH / 2 + yOffset + (primaryWave + secondaryWave) * liveAmplitude;
                ctx.lineTo(x, y);
            }

            if (!waveGradients[waveIndex]) {
                const g = ctx.createLinearGradient(0, 0, logW, logH);
                g.addColorStop(0, wave.gradientColors[0]);
                g.addColorStop(1, wave.gradientColors[1]);
                waveGradients[waveIndex] = g;
            }

            ctx.strokeStyle = waveGradients[waveIndex]!;
            ctx.lineWidth = liveWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            ctx.restore();
        };

        const animate = () => {
            if (performance.now() - lastActivity > IDLE_TIMEOUT) {
                idlePaused = true;
                return;
            }
            ctx.clearRect(0, 0, logW, logH);

            // Фоновый градиент — кешируем, пересоздаём только после resize
            if (!bgGradient) {
                bgGradient = ctx.createLinearGradient(0, 0, logW, logH);
                bgGradient.addColorStop(0, '#2c3e50');
                bgGradient.addColorStop(1, '#34495e');
            }
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, logW, logH);

            waves.forEach((wave, waveIndex) => {
                const dynamicSpacing =
                    65 + Math.sin(time * 0.0025 * speedMultiplier + waveIndex) * 55;
                const yOffset = (waveIndex - waves.length / 2) * dynamicSpacing;
                drawWave(wave, yOffset, waveIndex);
            });

            time += 1;
            animationId = requestAnimationFrame(animate);
        };

        const onVisibilityChange = () => {
            isVisible = !document.hidden;
            if (isVisible) {
                lastActivity = performance.now();
                idlePaused = false;
                animationId = requestAnimationFrame(animate);
            } else {
                cancelAnimationFrame(animationId);
            }
        };

        const onActivity = () => {
            lastActivity = performance.now();
            if (idlePaused && isVisible) {
                idlePaused = false;
                animationId = requestAnimationFrame(animate);
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('mousemove', onActivity, { passive: true });
        window.addEventListener('scroll', onActivity, { passive: true });
        window.addEventListener('touchstart', onActivity, { passive: true });
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            ro.disconnect();
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('mousemove', onActivity);
            window.removeEventListener('scroll', onActivity);
            window.removeEventListener('touchstart', onActivity);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return <canvas ref={canvasRef} className="thin-waves-canvas"></canvas>;
});

export default ThinWavesBackground;
