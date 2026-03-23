import { memo, useEffect, useRef } from 'react';
import asciiRaw from '@/assets/Az3d_ascii.txt?raw';

const CHAR_W = 8;
const CHAR_H = 14;
const FONT = `11px 'Courier New', monospace`;
const CHARS = '@%#*+=-:.';
const MAX_DROPLETS = 60;
// ── Глитч ────────────────────────────────────────────────────────────────────
const GLITCH_INTERVAL = 8000;
const GLITCH_DURATION = 350;
// ── Throttle / idle ──────────────────────────────────────────────────────────
const FPS_CAP = 30;
const FRAME_MS = 1000 / FPS_CAP;
const IDLE_TIMEOUT = 30_000;

const ASCII_LINES = asciiRaw.split('\n');

// Bounding box реального контента — не маппим пустые края
function getContentBounds(lines: string[]) {
    let minCol = Infinity,
        maxCol = -1,
        minRow = Infinity,
        maxRow = -1;
    for (let r = 0; r < lines.length; r++) {
        const line = lines[r];
        for (let c = 0; c < line.length; c++) {
            if (line[c] !== ' ') {
                if (c < minCol) minCol = c;
                if (c > maxCol) maxCol = c;
                if (r < minRow) minRow = r;
                if (r > maxRow) maxRow = r;
            }
        }
    }
    return { minCol, maxCol, minRow, maxRow };
}

const BOUNDS = getContentBounds(ASCII_LINES);
const CONTENT_COLS = BOUNDS.maxCol - BOUNDS.minCol + 1;
const CONTENT_ROWS = BOUNDS.maxRow - BOUNDS.minRow + 1;

// Активные ASCII-колонки (в координатах контента, не всего файла)
function buildActiveContentCols(lines: string[], bounds: typeof BOUNDS): Set<number> {
    const active = new Set<number>();
    for (const line of lines) {
        for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
            if (line[c] && line[c] !== ' ') active.add(c - bounds.minCol);
        }
    }
    return active;
}

const ACTIVE_ASCII_COLS = buildActiveContentCols(ASCII_LINES, BOUNDS);

interface Droplet {
    col: number;
    y: number;
    speed: number;
    length: number;
    chars: string[];
}

const rnd = (str: string) => str[Math.floor(Math.random() * str.length)];

// Плотность символа → opacity статичного слоя (@ = ярко, . = почти нет)
const DENSITY_MAP: Record<string, number> = {};
const DENSITY_CHARS = '@%#*+=-:.';
for (let i = 0; i < DENSITY_CHARS.length; i++) {
    DENSITY_MAP[DENSITY_CHARS[i]] = 0.7 - (i / (DENSITY_CHARS.length - 1)) * 0.62;
}
const charOpacity = (ch: string): number => DENSITY_MAP[ch] ?? 0.08;

function renderStaticShape(
    offscreen: HTMLCanvasElement,
    cssW: number,
    cssH: number,
    dpr: number
): void {
    offscreen.width = cssW * dpr;
    offscreen.height = cssH * dpr;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    // canvas.width присваивание сбрасывает трансформ — setTransform явно задаёт масштаб
    offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    offCtx.font = FONT;

    const numCols = Math.floor(cssW / CHAR_W);
    const numRows = Math.floor(cssH / CHAR_H);

    for (let canvasCol = 0; canvasCol < numCols; canvasCol++) {
        const contentCol = Math.round((canvasCol * (CONTENT_COLS - 1)) / Math.max(1, numCols - 1));
        const asciiCol = contentCol + BOUNDS.minCol;

        for (let contentRow = 0; contentRow < CONTENT_ROWS; contentRow++) {
            const asciiRow = contentRow + BOUNDS.minRow;
            const ch = ASCII_LINES[asciiRow]?.[asciiCol];
            if (!ch || ch === ' ') continue;

            const canvasRow = Math.round(
                (contentRow * (numRows - 1)) / Math.max(1, CONTENT_ROWS - 1)
            );
            const alpha = charOpacity(ch);
            offCtx.fillStyle = `rgba(255, 244, 234, ${alpha.toFixed(2)})`;
            offCtx.fillText(ch, canvasCol * CHAR_W, (canvasRow + 1) * CHAR_H);
        }
    }
}

const AsciiRain = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Lazy init в useEffect — не вызываем document API при рендере (SSR-safe, StrictMode-safe)
    const offscreenRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Lazy init offscreen canvas
        offscreenRef.current ??= document.createElement('canvas');
        const offscreen = offscreenRef.current;

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let cancelled = false;
        let rafId = 0;
        let activeCols: number[] = [];
        let numRows = 0;
        let dpr = 1;
        const droplets: Droplet[] = [];

        const drawStatic = (cssW: number, cssH: number) => {
            ctx.clearRect(0, 0, cssW, cssH);
            ctx.drawImage(offscreen, 0, 0, cssW, cssH);
        };

        const resize = () => {
            dpr = Math.min(window.devicePixelRatio, 2);
            const cssW = canvas.clientWidth;
            const cssH = canvas.clientHeight;
            canvas.width = cssW * dpr;
            canvas.height = cssH * dpr;
            // canvas.width сбрасывает трансформ — явно задаём вместо накопительного scale()
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.font = FONT;

            const numCols = Math.floor(cssW / CHAR_W);
            numRows = Math.floor(cssH / CHAR_H);

            activeCols = [];
            for (let col = 0; col < numCols; col++) {
                const contentCol = Math.round(
                    (col * (CONTENT_COLS - 1)) / Math.max(1, numCols - 1)
                );
                if (ACTIVE_ASCII_COLS.has(contentCol)) activeCols.push(col);
            }

            droplets.length = 0;
            renderStaticShape(offscreen, cssW, cssH, dpr);
            // Рисуем статику сразу — видно до старта анимации и при prefers-reduced-motion
            drawStatic(cssW, cssH);
        };

        resize();

        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        // Только статика при prefers-reduced-motion
        if (prefersReduced) {
            return () => ro.disconnect();
        }

        // ── Дождь ────────────────────────────────────────────────────

        let lastGlitchTime = -GLITCH_INTERVAL;
        let lastFrameTime = 0;
        let lastActivityTime = performance.now();
        let isPageVisible = !document.hidden;
        let idlePaused = false;

        const spawn = (): Droplet => {
            const col = activeCols[Math.floor(Math.random() * activeCols.length)];
            const length = 6 + Math.floor(Math.random() * 14);
            return {
                col,
                y: -Math.random() * 20,
                speed: 0.15 + Math.random() * 0.45,
                length,
                chars: Array.from({ length: length + 1 }, () => rnd(CHARS)),
            };
        };

        const animate = (now: number) => {
            if (cancelled) return;
            if (!isPageVisible || now - lastActivityTime > IDLE_TIMEOUT) {
                idlePaused = true;
                rafId = 0;
                return;
            }
            if (now - lastFrameTime < FRAME_MS) {
                rafId = requestAnimationFrame(animate);
                return;
            }
            lastFrameTime = now;

            const cssW = canvas.clientWidth;
            const cssH = canvas.clientHeight;

            // Статика как основа каждого кадра
            drawStatic(cssW, cssH);
            ctx.font = FONT;

            if (activeCols.length > 0) {
                while (droplets.length < MAX_DROPLETS) {
                    droplets.push(spawn());
                }

                for (let i = droplets.length - 1; i >= 0; i--) {
                    const d = droplets[i];
                    d.y += d.speed;
                    d.chars[0] = rnd(CHARS);

                    const headRow = Math.floor(d.y);

                    for (let t = 0; t <= d.length; t++) {
                        const row = headRow - t;
                        if (row < 0 || row >= numRows) continue;

                        const alpha = t === 0 ? 1 : Math.max(0, (1 - t / d.length) * 0.8);
                        ctx.fillStyle =
                            t === 0
                                ? `rgba(255, 244, 234, ${alpha.toFixed(2)})`
                                : `rgba(0, 114, 209, ${alpha.toFixed(2)})`;

                        ctx.fillText(d.chars[t] ?? rnd(CHARS), d.col * CHAR_W, (row + 1) * CHAR_H);
                    }

                    if (headRow - d.length > numRows) {
                        droplets.splice(i, 1);
                    }
                }
            }

            // ── Глитч каждые 8 секунд ────────────────────────────────
            if (now - lastGlitchTime > GLITCH_INTERVAL) {
                lastGlitchTime = now;
            }
            if (now - lastGlitchTime < GLITCH_DURATION) {
                const numStripes = 3 + Math.floor(Math.random() * 5);
                for (let s = 0; s < numStripes; s++) {
                    if (Math.random() < 0.4) continue;
                    const sy = Math.random() * cssH;
                    const sh = CHAR_H * (1 + Math.floor(Math.random() * 3));
                    const dx = (Math.random() - 0.5) * CHAR_W * 8;
                    // Клампим src-координаты чтобы не выйти за пределы offscreen при dpr>1
                    const srcY = Math.min(sy * dpr, offscreen.height - 1);
                    const srcH = Math.min(sh * dpr, offscreen.height - srcY);
                    ctx.drawImage(offscreen, 0, srcY, offscreen.width, srcH, dx, sy, cssW, sh);
                }
            }

            rafId = requestAnimationFrame(animate);
        };

        const onVisibilityChange = () => {
            isPageVisible = !document.hidden;
            if (isPageVisible && idlePaused) {
                idlePaused = false;
                lastActivityTime = performance.now();
                rafId = requestAnimationFrame(animate);
            } else if (!isPageVisible) {
                cancelAnimationFrame(rafId);
                rafId = 0;
            }
        };

        const onActivity = () => {
            lastActivityTime = performance.now();
            if (idlePaused && isPageVisible) {
                idlePaused = false;
                rafId = requestAnimationFrame(animate);
            }
        };

        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    if (!rafId && !cancelled) rafId = requestAnimationFrame(animate);
                } else {
                    cancelAnimationFrame(rafId);
                    rafId = 0;
                }
            },
            { rootMargin: '100px' }
        );
        io.observe(canvas);
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('mousemove', onActivity, { passive: true });
        window.addEventListener('scroll', onActivity, { passive: true });

        return () => {
            cancelled = true;
            cancelAnimationFrame(rafId);
            ro.disconnect();
            io.disconnect();
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('mousemove', onActivity);
            window.removeEventListener('scroll', onActivity);
        };
    }, []);

    return <canvas ref={canvasRef} className="contacts-ascii-canvas" aria-hidden="true" />;
});

AsciiRain.displayName = 'AsciiRain';
export default AsciiRain;
