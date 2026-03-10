import React, { useEffect, useRef, useCallback } from 'react';

export interface Ball {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    scale: number;
    targetScale: number;
    nudgeTimer: number;
    breathePhase: number;
    breatheSpeed: number;
    zIndex: number;
    blobPoints: { x: number; y: number }[];
    imageIndex: number;
    prevImageIndex: number;
    imageAlpha: number;
    imageSwitchTimer: number;
}

interface UseBouncingBallsOptions {
    count: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    images: HTMLImageElement[];
    altImages?: HTMLImageElement[][];
    hoveredIdRef: React.RefObject<number | null>;
}

const IMAGE_SWITCH_INTERVAL_S = 0.8;
const IMAGE_ALPHA_LERP = 0.12;

const MIN_SPEED = 0.5;
const MAX_SPEED = 1;
const MIN_RADIUS = 55;
const MAX_RADIUS = 180;
const SCALE_LERP = 0.08;
const NUDGE_INTERVAL = 180;
const NUDGE_FORCE = 0.5;
const BREATHE_AMPLITUDE = 0.08;
const FPS_CAP = 30;
const FRAME_MS = 1000 / FPS_CAP;
const OVERLAP_THRESHOLD = 0.85;
const REPULSION_FORCE = 0.3;
const HOVERED_RADIUS = 200;

function randomBetween(min: number, max: number) {
    return min + Math.random() * (max - min);
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function generateBlobPoints(count = 8): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const r = 0.75 + Math.random() * 0.25;
        points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    return points;
}

function traceBlobPath(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], cx: number, cy: number, r: number, tension = 0.5): void {
    const n = pts.length;
    const p = pts.map((pt) => ({ x: cx + pt.x * r, y: cy + pt.y * r }));

    ctx.beginPath();
    ctx.moveTo(p[0]!.x, p[0]!.y);

    for (let i = 0; i < n; i++) {
        const p0 = p[(i - 1 + n) % n]!;
        const p1 = p[i]!;
        const p2 = p[(i + 1) % n]!;
        const p3 = p[(i + 2) % n]!;

        const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3;
        const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3;
        const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3;
        const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }

    ctx.closePath();
}

function drawBall(
    ctx: CanvasRenderingContext2D,
    ball: Ball,
    baseImages: HTMLImageElement[],
    altImages: HTMLImageElement[][]
) {
    const ballAlt = altImages[ball.id] ?? [];
    const getImg = (index: number): HTMLImageElement =>
        index === 0
            ? baseImages[ball.id % baseImages.length]!
            : ballAlt[index - 1] ?? baseImages[ball.id % baseImages.length]!;

    const prevImg = getImg(ball.prevImageIndex);
    const currentImg = getImg(ball.imageIndex);

    const breathe = 1 + Math.sin(ball.breathePhase) * BREATHE_AMPLITUDE;
    const r = ball.radius * ball.scale * breathe;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#000';
    traceBlobPath(ctx, ball.blobPoints, ball.x, ball.y, r);
    ctx.fill();
    ctx.restore();

    ctx.save();
    traceBlobPath(ctx, ball.blobPoints, ball.x, ball.y, r);
    ctx.clip();
    ctx.globalAlpha = 1;
    ctx.drawImage(prevImg, ball.x - r, ball.y - r, r * 2, r * 2);
    ctx.globalAlpha = ball.imageAlpha;
    ctx.drawImage(currentImg, ball.x - r, ball.y - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
    ctx.restore();
}

function initBalls(count: number, width: number, height: number): Ball[] {
    const maxAllowedRadius = Math.min(MAX_RADIUS, width / 4, height / 4);

    return Array.from({ length: count }, (_, i) => {
        const radius = randomBetween(MIN_RADIUS, maxAllowedRadius);
        return {
            id: i,
            x: randomBetween(radius, width - radius),
            y: randomBetween(radius, height - radius),
            vx: randomBetween(MIN_SPEED, MAX_SPEED) * (Math.random() > 0.5 ? 1 : -1),
            vy: randomBetween(MIN_SPEED, MAX_SPEED) * (Math.random() > 0.5 ? 1 : -1),
            radius,
            scale: 1,
            targetScale: 1,
            nudgeTimer: Math.floor(Math.random() * NUDGE_INTERVAL),
            breathePhase: Math.random() * Math.PI * 2,
            breatheSpeed: 0.008 + (i % 5) * 0.002,
            zIndex: 0,
            blobPoints: generateBlobPoints(),
            imageIndex: 0,
            prevImageIndex: 0,
            imageAlpha: 1,
            imageSwitchTimer: Math.random() * IMAGE_SWITCH_INTERVAL_S,
        };
    });
}

function applyRepulsion(balls: Ball[]) {
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const a = balls[i];
            const b = balls[j];

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            const minDist = (a.radius + b.radius) * OVERLAP_THRESHOLD;

            if (dist < minDist && dist > 0) {
                const overlap = (minDist - dist) / minDist;
                const force = overlap * REPULSION_FORCE;

                const nx = dx / dist;
                const ny = dy / dist;

                a.vx -= nx * force;
                a.vy -= ny * force;
                b.vx += nx * force;
                b.vy += ny * force;

                const clamp = (v: number) => Math.sign(v) * Math.min(Math.abs(v), MAX_SPEED * 2);
                a.vx = clamp(a.vx);
                a.vy = clamp(a.vy);
                b.vx = clamp(b.vx);
                b.vy = clamp(b.vy);
            }
        }
    }
}

const isActive = () => !document.hidden;

export function useBouncingBalls({ count, containerRef, canvasRef, images, altImages = [], hoveredIdRef }: UseBouncingBallsOptions) {
    const ballsRef = useRef<Ball[]>([]);
    const rafRef = useRef<number>(0);
    const isVisibleRef = useRef(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let initialized = false;
        let cachedW = 0;
        let cachedH = 0;
        let lastFrameTime = 0;
        let sorted: Ball[] = [];
        let zIndexDirty = true;

        const startTick = () => {
            if (isVisibleRef.current && isActive() && initialized) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };

        const stopTick = () => cancelAnimationFrame(rafRef.current);

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting;
                entry.isIntersecting ? startTick() : stopTick();
            },
            { rootMargin: '100px' }
        );

        intersectionObserver.observe(container);

        const handleVisibility = () => {
            if (document.hidden) {
                stopTick();
            } else {
                lastFrameTime = 0;
                startTick();
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);

        const tick = (timestamp: number) => {
            rafRef.current = requestAnimationFrame(tick);

            if (timestamp - lastFrameTime < FRAME_MS) return;
            const delta = (timestamp - lastFrameTime) / 1000;
            lastFrameTime = timestamp;

            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const balls = ballsRef.current;
            const hoveredId = hoveredIdRef.current;
            const w = cachedW;
            const h = cachedH;

            ctx.clearRect(0, 0, w, h);

            for (const ball of balls) {
                ball.x += ball.vx;
                ball.y += ball.vy;

                const effectiveR = ball.radius * ball.scale * (1 + BREATHE_AMPLITUDE);

                if (ball.x - effectiveR <= 0) {
                    ball.x = effectiveR;
                    ball.vx = Math.abs(ball.vx);
                } else if (ball.x + effectiveR >= w) {
                    ball.x = w - effectiveR;
                    ball.vx = -Math.abs(ball.vx);
                }

                if (ball.y - effectiveR <= 0) {
                    ball.y = effectiveR;
                    ball.vy = Math.abs(ball.vy);
                } else if (ball.y + effectiveR >= h) {
                    ball.y = h - effectiveR;
                    ball.vy = -Math.abs(ball.vy);
                }

                const speed = Math.hypot(ball.vx, ball.vy);
                if (speed < MIN_SPEED) {
                    const angle = Math.atan2(ball.vy, ball.vx);
                    ball.vx = Math.cos(angle) * MIN_SPEED;
                    ball.vy = Math.sin(angle) * MIN_SPEED;
                }

                ball.nudgeTimer++;
                if (ball.nudgeTimer >= NUDGE_INTERVAL) {
                    ball.nudgeTimer = 0;
                    const angle = Math.random() * Math.PI * 2;
                    ball.vx += Math.cos(angle) * NUDGE_FORCE;
                    ball.vy += Math.sin(angle) * NUDGE_FORCE;

                    const nudgedSpeed = Math.hypot(ball.vx, ball.vy);
                    if (nudgedSpeed > MAX_SPEED) {
                        ball.vx = (ball.vx / nudgedSpeed) * MAX_SPEED;
                        ball.vy = (ball.vy / nudgedSpeed) * MAX_SPEED;
                    }
                }

                const isHovered = ball.id === hoveredId;
                const targetScale = hoveredId === null ? 1 : isHovered ? HOVERED_RADIUS / ball.radius : 0.6;
                ball.targetScale = targetScale;
                if (Math.abs(ball.targetScale - ball.scale) > 0.001) {
                    ball.scale = lerp(ball.scale, ball.targetScale, SCALE_LERP);
                } else {
                    ball.scale = ball.targetScale;
                }

                const newZIndex = lerp(ball.zIndex, isHovered ? 1 : 0, 0.06);
                if (Math.abs(newZIndex - ball.zIndex) > 0.0005) zIndexDirty = true;
                ball.zIndex = newZIndex;

                ball.breathePhase += ball.breatheSpeed;

                // Image switching — only while hovered, reset to base on leave
                ball.imageSwitchTimer += delta;
                const hasVariants = (altImages[ball.id]?.length ?? 0) > 0;

                if (hasVariants && isHovered && ball.imageSwitchTimer >= IMAGE_SWITCH_INTERVAL_S) {
                    ball.imageSwitchTimer = 0;
                    const total = 1 + altImages[ball.id]!.length;
                    const next = ball.imageIndex + 1;
                    if (next < total) {
                        ball.prevImageIndex = ball.imageIndex;
                        ball.imageIndex = next;
                        ball.imageAlpha = 0;
                    }
                }

                if (hasVariants && !isHovered && ball.imageIndex !== 0) {
                    ball.prevImageIndex = ball.imageIndex;
                    ball.imageIndex = 0;
                    ball.imageAlpha = 0;
                    ball.imageSwitchTimer = 0;
                }

                if (ball.imageAlpha < 1) {
                    ball.imageAlpha = lerp(ball.imageAlpha, 1, IMAGE_ALPHA_LERP);
                }
            }

            applyRepulsion(balls);

            if (zIndexDirty) {
                sorted = [...balls].sort((a, b) => a.zIndex - b.zIndex);
                zIndexDirty = false;
            }

            for (const ball of sorted) {
                drawBall(ctx, ball, images, altImages);
            }
        };

        const resizeObserver = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            if (width === 0 || height === 0) return;

            cachedW = width;
            cachedH = height;

            const canvas = canvasRef.current;
            if (canvas) {
                const dpr = window.devicePixelRatio || 1;
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }

            if (initialized) return;

            ballsRef.current = initBalls(count, width, height);
            initialized = true;
            startTick();
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
            document.removeEventListener('visibilitychange', handleVisibility);
            stopTick();
        };
    }, [count, containerRef, canvasRef, images, altImages, hoveredIdRef]);

    return ballsRef;
}

export function useHitTest(
    ballsRef: React.RefObject<Ball[]>,
    containerRef: React.RefObject<HTMLDivElement | null>,
    hoveredIdRef: React.RefObject<number | null>
) {
    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;

            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            const balls = ballsRef.current;
            let found: number | null = null;

            const sorted = [...balls].sort((a, b) => b.zIndex - a.zIndex);

            for (const ball of sorted) {
                const breathe = 1 + Math.sin(ball.breathePhase) * BREATHE_AMPLITUDE;
                const effectiveR = ball.radius * ball.scale * breathe;
                if (Math.hypot(mx - ball.x, my - ball.y) <= effectiveR) {
                    found = ball.id;
                    break;
                }
            }

            const container = containerRef.current;
            hoveredIdRef.current = found;
            if (container) container.style.cursor = found !== null ? 'pointer' : 'default';
        },
        [ballsRef, containerRef, hoveredIdRef]
    );

    const handleMouseLeave = useCallback(() => {
        hoveredIdRef.current = null;
        if (containerRef.current) containerRef.current.style.cursor = 'default';
    }, [containerRef, hoveredIdRef]);

    return { handleMouseMove, handleMouseLeave };
}
