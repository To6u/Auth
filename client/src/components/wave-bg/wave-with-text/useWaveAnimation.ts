import { useEffect } from 'react';
import type { RefObject } from 'react';
import {
    createWaveProgram,
    createLineProgram,
    fillWaveVertices,
    generateTextLines,
    updateMouseState,
    lerp,
    WAVE_SCROLL_CONFIG,
} from './wave-bg.utils';
import { renderWave, renderTextLines } from './wave-bg.render';
import { createTextAnimState, updateTextAnimState, ANIM_BUFFER_MULTIPLIER } from './wave-bg.anim';
import { wavesConfig } from '@/components/wave-bg/wave-with-text/wavesConfigWebGL';
import type { MouseState, TextLine } from './wave-bg.types';

export const useWaveAnimation = (
    canvasRef: RefObject<HTMLCanvasElement | null>,
    showTextRef: RefObject<boolean>
): void => {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let cancelled = false;
        let animFrame = 0;

        const gl = canvas.getContext('webgl', {
            alpha: true,
            antialias: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'low-power',
        });

        if (!gl) {
            console.error('WebGL not supported');
            return;
        }

        gl.getExtension('OES_standard_derivatives');

        const waveProgram = createWaveProgram(gl);
        const lineProgram = createLineProgram(gl);
        if (!waveProgram || !lineProgram) return;

        const waveBuffer = gl.createBuffer();
        const lineBuffer = gl.createBuffer();

        if (!waveBuffer || !lineBuffer) {
            console.error('Failed to create WebGL buffers');
            return;
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Скорость slide: ~0.8с при 60fps — симметрично entry (initialSpeed=0.02 ≈ 50 кадров)
        const ROUTE_EXIT_SPEED = 0.05;

        let vertexBuffers: Float32Array[] = [];
        let lineDataBuf: Float32Array = new Float32Array(0);
        // 0 = текст на месте, 1 = линии полностью ушли за экран
        let routeExitProgress = showTextRef.current ? 0 : 1;
        let dpr = 1;

        const resize = () => {
            if (cancelled) return;
            dpr = Math.min(window.devicePixelRatio, 2);
            const w = window.innerWidth * dpr;
            const h = window.innerHeight * dpr;
            canvas.width = w;
            canvas.height = h;
            gl.viewport(0, 0, w, h);

            const step = Math.max(8, Math.floor(w / 450));
            const bufSize = Math.ceil(w / step + 1) * 2 * 2;
            vertexBuffers = wavesConfig.map(() => new Float32Array(bufSize));

            const maxLines = 200;
            lineDataBuf = new Float32Array(maxLines * ANIM_BUFFER_MULTIPLIER);
        };

        resize();

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(document.body);

        const mouse: MouseState = {
            x: 0,
            y: 0,
            smoothX: 0,
            smoothY: 0,
            active: false,
            smoothActive: 0,
        };

        const onMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            mouse.active = true;
        };
        const onMouseLeave = () => {
            mouse.active = false;
        };

        // Создаём anim внутри effect — чистое состояние при каждом mount
        const anim = createTextAnimState();
        const textLines: TextLine[] = [];

        // Растеризация текста запускается всегда — текст готов к показу
        // в момент перехода на ProfilePage, даже если стартовали с LoginPage
        generateTextLines().then((lines) => {
            if (cancelled) return;
            textLines.push(...lines);
            anim.initialized = true;
            anim.lastMorphTime = performance.now();
            lineDataBuf = new Float32Array(lines.length * ANIM_BUFFER_MULTIPLIER);
        });

        window.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseleave', onMouseLeave);

        const onScroll = () => {
            anim.scrollY = window.scrollY;
        };
        window.addEventListener('scroll', onScroll, { passive: true });

        const animate = (time: number) => {
            if (cancelled) return;

            updateMouseState(mouse);

            const { width, height } = canvas;
            const step = Math.max(8, Math.floor(width / 450));

            const viewportHeight = height / dpr;
            const targetWaveProgress = Math.max(
                0,
                Math.min(1, anim.scrollY / (viewportHeight * WAVE_SCROLL_CONFIG.scrollRange))
            );
            anim.waveScrollProgress = lerp(anim.waveScrollProgress, targetWaveProgress, WAVE_SCROLL_CONFIG.smoothing);

            // Route exit/enter: slide линий по той же оси что entry-анимация
            const showText = showTextRef.current;
            if (showText) {
                if (!anim.initialDone) {
                    // Первый визит: snap в 0 — entry-анимация (initialProgress) берёт управление
                    routeExitProgress = 0;
                } else {
                    // Возврат на страницу: линии плавно возвращаются с боков
                    routeExitProgress = lerp(routeExitProgress, 0, ROUTE_EXIT_SPEED);
                }
            } else {
                // Уход со страницы: линии уезжают по бокам
                routeExitProgress = lerp(routeExitProgress, 1, ROUTE_EXIT_SPEED);
            }
            const isTextVisible = showText || routeExitProgress < 0.999;

            // Обновляем anim state один раз за кадр перед рендером
            if (isTextVisible) {
                updateTextAnimState(anim, time);
            }

            const mouseInfluenceFactor =
                isTextVisible && anim.exitProgress > 0.3
                    ? Math.max(0, 1 - (anim.exitProgress - 0.3) / 0.4)
                    : 1;

            const effectiveMouse: MouseState = {
                ...mouse,
                smoothActive: mouse.smoothActive * mouseInfluenceFactor,
            };

            gl.clear(gl.COLOR_BUFFER_BIT);

            const buf0 = vertexBuffers[0];
            if (buf0) {
                const count = fillWaveVertices(
                    buf0,
                    width,
                    height,
                    wavesConfig[0],
                    time,
                    step,
                    effectiveMouse,
                    dpr,
                    anim.waveScrollProgress
                );
                renderWave(gl, waveProgram, waveBuffer, buf0, count, 0, time, width, height);
            }

            if (isTextVisible) {
                renderTextLines(gl, lineProgram, lineBuffer, lineDataBuf, textLines, anim, width, height, dpr, routeExitProgress);
            }

            for (let i = 1; i < wavesConfig.length; i++) {
                const buf = vertexBuffers[i];
                if (!buf) continue;
                const count = fillWaveVertices(
                    buf,
                    width,
                    height,
                    wavesConfig[i],
                    time,
                    step,
                    effectiveMouse,
                    dpr,
                    anim.waveScrollProgress
                );
                renderWave(gl, waveProgram, waveBuffer, buf, count, i, time, width, height);
            }

            animFrame = requestAnimationFrame(animate);
        };

        animFrame = requestAnimationFrame(animate);

        return () => {
            cancelled = true;
            cancelAnimationFrame(animFrame);

            window.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseleave', onMouseLeave);
            window.removeEventListener('scroll', onScroll);
            resizeObserver.disconnect();

            gl.deleteProgram(waveProgram.program);
            gl.deleteProgram(lineProgram.program);
            gl.deleteBuffer(waveBuffer);
            gl.deleteBuffer(lineBuffer);
        };
        // canvasRef и showTextRef — стабильные рефы, не нужны в deps
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
};
