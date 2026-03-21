import type { RefObject } from 'react';
import { useEffect } from 'react';
import { wavesConfig } from '@/components/wave-bg/wave-with-text/wavesConfigWebGL';
import { projectsState } from '@/lib/projectsState';
import { ANIM_BUFFER_MULTIPLIER, createTextAnimState, updateTextAnimState } from './wave-bg.anim';
import { renderTextLines, renderWave } from './wave-bg.render';
import type { MouseState, TextLine } from './wave-bg.types';
import {
    createLineProgram,
    createWaveProgram,
    fillWaveVertices,
    fillWaveVerticesVertical,
    generateTextLines,
    lerp,
    updateMouseState,
    WAVE_SCROLL_CONFIG,
} from './wave-bg.utils';

export const useWaveAnimation = (
    canvasRef: RefObject<HTMLCanvasElement | null>,
    showTextRef: RefObject<boolean>,
    isStatic = false,
    noWaves = false
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

        const waveProgram = noWaves ? null : createWaveProgram(gl);
        const lineProgram = createLineProgram(gl);
        if ((!waveProgram && !noWaves) || !lineProgram) return;

        const waveBuffer = noWaves ? null : gl.createBuffer();
        const lineBuffer = gl.createBuffer();

        if ((!waveBuffer && !noWaves) || !lineBuffer) {
            console.error('Failed to create WebGL buffers');
            return;
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Скорость slide: ~0.8с при 60fps — симметрично entry (initialSpeed=0.02 ≈ 50 кадров)
        const ROUTE_EXIT_SPEED = 0.05;
        // Lerp-коэффициент сглаживания speedFactor волн при скролле Projects
        const SPEED_FACTOR_LERP = 0.06;
        // Lerp-коэффициент появления секции Contacts (медленнее — плавный parallax)
        const CONTACTS_LERP = 0.05;
        // Коэффициент X-параллакса canvas относительно camX (8% смещения)
        const CANVAS_PARALLAX_FACTOR = 0.08;

        let vertexBuffers: Float32Array[] = [];
        let lineDataBuf: Float32Array = new Float32Array(0);
        // 0 = текст на месте, 1 = линии полностью ушли за экран
        let routeExitProgress = showTextRef.current ? 0 : 1;
        let prevTime = 0;
        let phaseAccumulator = 0;
        // Плавный parallax-сдвиг canvas по X — lerp к target чтобы не было резкого прыжка
        // при входе/выходе из блока проектов (projectsState.active toggle).
        let canvasOffsetX = 0;
        let dpr = 1;
        let isPageVisible = !document.hidden;
        let lastActivityTime = performance.now();
        let isIdlePaused = false;
        const IDLE_TIMEOUT = 30_000; // pause after 30s of no activity

        const resize = () => {
            if (cancelled) return;
            dpr = Math.min(window.devicePixelRatio, 2);
            const w = window.innerWidth * dpr;
            const h = window.innerHeight * dpr;
            canvas.width = w;
            canvas.height = h;
            gl.viewport(0, 0, w, h);

            const step = Math.max(8, Math.floor(w / 450));
            // Буфер должен покрывать и горизонталь (w) и вертикаль (h) —
            // вертикальные волны итерируются по высоте, на мобилке h >> w
            const bufSize = Math.ceil(Math.max(w, h) / step + 1) * 2 * 2;
            if (!noWaves) {
                vertexBuffers = wavesConfig.map(() => new Float32Array(bufSize));
            }

            const maxLines = 200;
            lineDataBuf = new Float32Array(maxLines * ANIM_BUFFER_MULTIPLIER);
        };

        resize();

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(document.documentElement);

        const mouse: MouseState = {
            x: 0,
            y: 0,
            smoothX: 0,
            smoothY: 0,
            active: false,
            smoothActive: 0,
        };

        const onMouseMoveCoords = (e: MouseEvent) => {
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

        window.addEventListener('mousemove', onMouseMoveCoords, { passive: true });
        document.addEventListener('mouseleave', onMouseLeave, { passive: true });

        const onScroll = () => {
            anim.scrollY = window.scrollY;

            const contactsEl = document.getElementById('contacts');
            if (contactsEl) {
                const rect = contactsEl.getBoundingClientRect();
                const vh = window.innerHeight;
                // 0 = секция ниже вьюпорта, 1 = секция полностью видна (rect.bottom <= vh)
                const raw = (vh + rect.height - rect.bottom) / rect.height;
                anim.contactsTarget = Math.max(0, Math.min(1, raw));
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });

        const animate = (time: number) => {
            if (cancelled) return;

            // Idle check — только на десктопе (на мобилке нет mousemove, idle нельзя детектировать корректно)
            if (!isStatic && time - lastActivityTime > IDLE_TIMEOUT) {
                isIdlePaused = true;
                return;
            }
            isIdlePaused = false;

            const delta = prevTime === 0 ? 16 : Math.min(time - prevTime, 50);
            prevTime = time;
            const targetSpeedFactor = projectsState.isScrolling
                ? 1 + projectsState.camProgress * 0.6
                : 1;
            projectsState.smoothedSpeedFactor +=
                (targetSpeedFactor - projectsState.smoothedSpeedFactor) * SPEED_FACTOR_LERP;
            // На мобилке/планшете волны статичны — фаза не накапливается
            if (!isStatic) {
                phaseAccumulator += delta * projectsState.smoothedSpeedFactor;
                if (phaseAccumulator > 1_000_000) phaseAccumulator -= 1_000_000;
            }

            updateMouseState(mouse);

            const { width, height } = canvas;
            const step = Math.max(8, Math.floor(width / 450));

            const viewportHeight = height / dpr;
            const targetWaveProgress = Math.max(
                0,
                Math.min(1, anim.scrollY / (viewportHeight * WAVE_SCROLL_CONFIG.scrollRange))
            );
            anim.waveScrollProgress = lerp(
                anim.waveScrollProgress,
                targetWaveProgress,
                WAVE_SCROLL_CONFIG.smoothing
            );
            anim.contactsProgress = lerp(anim.contactsProgress, anim.contactsTarget, CONTACTS_LERP);

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

            const baseMouseInfluence =
                isTextVisible && anim.exitProgress > 0.3
                    ? Math.max(0, 1 - (anim.exitProgress - 0.3) / 0.4)
                    : 1;
            // При скролле к контактам восстанавливаем влияние мыши
            const mouseInfluenceFactor = Math.max(baseMouseInfluence, anim.contactsProgress);

            const effectiveMouse: MouseState = {
                ...mouse,
                smoothActive: mouse.smoothActive * mouseInfluenceFactor,
            };

            gl.clear(gl.COLOR_BUFFER_BIT);

            const wavesCanvas = canvasRef.current;
            if (wavesCanvas) {
                const targetOffsetX = projectsState.active
                    ? -projectsState.camX * CANVAS_PARALLAX_FACTOR
                    : 0;
                canvasOffsetX += (targetOffsetX - canvasOffsetX) * CANVAS_PARALLAX_FACTOR;

                const px = Math.round(canvasOffsetX * 10) / 10;
                const newTransform =
                    Math.abs(px) > 0.05 ? `translateZ(0) translateX(${px}px)` : 'translateZ(0)';
                if (wavesCanvas.style.transform !== newTransform) {
                    wavesCanvas.style.transform = newTransform;
                }
            }

            if (!noWaves) {
                // noWaves=false гарантирует ненулевые программу и буфер
                const wp = waveProgram!;
                const wb = waveBuffer!;
                // Compute all waves
                const counts = new Array<number>(wavesConfig.length).fill(0);
                for (let i = 0; i < wavesConfig.length; i++) {
                    const buf = vertexBuffers[i];
                    if (!buf) continue;
                    const waveConf = wavesConfig[i];

                    if (
                        waveConf.anchor === 'left' ||
                        waveConf.anchor === 'right' ||
                        waveConf.anchor === 'top-center'
                    ) {
                        counts[i] = fillWaveVerticesVertical(
                            buf,
                            width,
                            height,
                            waveConf,
                            time,
                            step,
                            effectiveMouse,
                            dpr,
                            anim.waveScrollProgress,
                            projectsState.camProgress,
                            waveConf.anchor as 'left' | 'right' | 'top-center',
                            phaseAccumulator,
                            anim.contactsProgress
                        );
                    } else {
                        counts[i] = fillWaveVertices(
                            buf,
                            width,
                            height,
                            waveConf,
                            time,
                            step,
                            effectiveMouse,
                            dpr,
                            anim.waveScrollProgress,
                            projectsState.camProgress,
                            phaseAccumulator
                        );
                    }
                }

                // Render wave 0
                const buf0 = vertexBuffers[0];
                if (buf0 && counts[0]) {
                    renderWave(gl, wp, wb, buf0, counts[0], 0, phaseAccumulator, width, height);
                }

                // Render text between wave 0 and waves 1-2
                if (isTextVisible) {
                    renderTextLines(
                        gl,
                        lineProgram,
                        lineBuffer,
                        lineDataBuf,
                        textLines,
                        anim,
                        width,
                        height,
                        dpr,
                        routeExitProgress
                    );
                }

                // Render waves 1-2
                for (let i = 1; i < wavesConfig.length; i++) {
                    const buf = vertexBuffers[i];
                    if (!buf || !counts[i]) continue;
                    renderWave(gl, wp, wb, buf, counts[i], i, phaseAccumulator, width, height);
                }
            } else if (isTextVisible) {
                // Только текст — волны не рендерим
                renderTextLines(
                    gl,
                    lineProgram,
                    lineBuffer,
                    lineDataBuf,
                    textLines,
                    anim,
                    width,
                    height,
                    dpr,
                    routeExitProgress
                );
            }

            animFrame = requestAnimationFrame(animate);
        };

        animFrame = requestAnimationFrame(animate);

        const resumeFromIdle = () => {
            lastActivityTime = performance.now();
            if (isIdlePaused && !cancelled && isPageVisible) {
                isIdlePaused = false;
                prevTime = 0;
                animFrame = requestAnimationFrame(animate);
            }
        };

        const onVisibilityChange = () => {
            if (document.hidden) {
                isPageVisible = false;
                cancelAnimationFrame(animFrame);
            } else {
                isPageVisible = true;
                isIdlePaused = false;
                lastActivityTime = performance.now();
                prevTime = 0;
                cancelAnimationFrame(animFrame);
                animFrame = requestAnimationFrame(animate);
            }
        };

        const onMouseMove = () => resumeFromIdle();
        const onScrollActivity = () => resumeFromIdle();
        const onTouch = () => resumeFromIdle();

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('scroll', onScrollActivity, { passive: true });
        window.addEventListener('touchstart', onTouch, { passive: true });
        window.addEventListener('touchmove', onTouch, { passive: true });

        return () => {
            cancelled = true;
            cancelAnimationFrame(animFrame);

            window.removeEventListener('mousemove', onMouseMoveCoords);
            document.removeEventListener('mouseleave', onMouseLeave);
            window.removeEventListener('scroll', onScroll);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('scroll', onScrollActivity);
            window.removeEventListener('touchstart', onTouch);
            window.removeEventListener('touchmove', onTouch);
            resizeObserver.disconnect();

            if (waveProgram) gl.deleteProgram(waveProgram.program);
            gl.deleteProgram(lineProgram.program);
            if (waveBuffer) gl.deleteBuffer(waveBuffer);
            gl.deleteBuffer(lineBuffer);

            if (canvasRef.current) {
                canvasRef.current.style.transform = 'translateZ(0)';
            }
        };
        // canvasRef и showTextRef — стабильные рефы, не нужны в deps
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
};
