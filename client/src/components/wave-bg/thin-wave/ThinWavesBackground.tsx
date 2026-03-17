import { useEffect, useRef } from 'react';
import {
    THIN_WAVE_SPEED_MULTIPLIER,
    type ThinWaveConfig,
    thinWavesConfig,
} from '@/components/wave-bg/thin-wave/thinWavesConfig.ts';

const ThinWavesBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const waves = thinWavesConfig;
        const speedMultiplier = THIN_WAVE_SPEED_MULTIPLIER / 10;

        let animationId: number;
        let time = 0;

        const drawWave = (wave: ThinWaveConfig, baseYOffset: number, waveIndex: number) => {
            if (!ctx || !canvas) return;

            ctx.save();

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(Math.PI / 4);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);

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

            const extendedWidth = canvas.width * 1.5;
            const startX = -canvas.width * 0.25;

            ctx.moveTo(startX, canvas.height / 2 + yOffset);

            for (let x = startX; x < extendedWidth; x += 2) {
                const primaryWave = Math.sin(
                    x * liveFrequency + wave.phase + time * wave.speed * speedMultiplier
                );
                const secondaryWave =
                    Math.sin(x * liveFrequency * 1.5 + time * wave.speed * speedMultiplier * 0.7) *
                    0.3;

                const y =
                    canvas.height / 2 + yOffset + (primaryWave + secondaryWave) * liveAmplitude;
                ctx.lineTo(x, y);
            }

            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, wave.gradientColors[0]);
            gradient.addColorStop(1, wave.gradientColors[1]);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = liveWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            ctx.restore();
        };

        const animate = () => {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Рисуем градиентный фон ТОЛЬКО в компоненте тонких волн
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#2c3e50');
            gradient.addColorStop(1, '#34495e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Рисуем тонкие волны
            waves.forEach((wave, waveIndex) => {
                const dynamicSpacing =
                    65 + Math.sin(time * 0.0025 * speedMultiplier + waveIndex) * 55;
                const yOffset = (waveIndex - waves.length / 2) * dynamicSpacing;
                drawWave(wave, yOffset, waveIndex);
            });

            time += 1;
            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return <canvas ref={canvasRef} className="thin-waves-canvas"></canvas>;
};

export default ThinWavesBackground;
