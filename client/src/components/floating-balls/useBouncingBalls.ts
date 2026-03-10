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

const IMAGE_SWITCH_INTERVAL = 9;

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

function buildBlobPath(pts: { x: number; y: number }[], cx: number, cy: number, r: number, tension = 0.5): Path2D {
    const n = pts.length;
    const blob = new Path2D();
    const p = pts.map((pt) => ({ x: cx + pt.x * r, y: cy + pt.y * r }));

    blob.moveTo(p[0].x, p[0].y);

    for (let i = 0; i < n; i++) {
        const p0 = p[(i - 1 + n) % n];
        const p1 = p[i];
        const p2 = p[(i + 1) % n];
        const p3 = p[(i + 2) % n];

        const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3;
        const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3;
        const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3;
        const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3;

        blob.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }

    blob.closePath();
    return blob;
}

function drawBall(
    ctx: CanvasRenderingContext2D,
    ball: Ball,
    baseImages: HTMLImageElement[],
    altImages: HTMLImageElement[][]
) {
    const ballAlt = altImages[ball.id] ?? [];
    const currentImg =
        ball.imageIndex === 0
            ? baseImages[ball.id % baseImages.length]!
            : ballAlt[ball.imageIndex - 1] ?? baseImages[ball.id % baseImages.length]!;

    const breathe = 1 + Math.sin(ball.breathePhase) * BREATHE_AMPLITUDE;
    const r = ball.radius * ball.scale * breathe;
    const blobShape = buildBlobPath(ball.blobPoints, ball.x, ball.y, r);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#000';
    ctx.fill(blobShape);
    ctx.restore();

    ctx.save();
    ctx.clip(blobShape);
    ctx.drawImage(currentImg, ball.x - r, ball.y - r, r * 2, r * 2);
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
            imageSwitchTimer: Math.floor(Math.random() * IMAGE_SWITCH_INTERVAL),
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
            document.hidden ? stopTick() : startTick();
        };

        document.addEventListener('visibilitychange', handleVisibility);

        const tick = (timestamp: number) => {
            rafRef.current = requestAnimationFrame(tick);

            if (timestamp - lastFrameTime < FRAME_MS) return;
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
                const targetScale = hoveredId === null ? 1 : isHovered ? 1.4 : 0.75;
                ball.targetScale = targetScale;
                if (Math.abs(ball.targetScale - ball.scale) > 0.001) {
                    ball.scale = lerp(ball.scale, ball.targetScale, SCALE_LERP);
                } else {
                    ball.scale = ball.targetScale;
                }

                ball.zIndex = lerp(ball.zIndex, isHovered ? 1 : 0, 0.06);

                ball.breathePhase += ball.breatheSpeed;

                // Image switching — only while hovered, reset to base on leave
                ball.imageSwitchTimer++;
                const hasVariants = (altImages[ball.id]?.length ?? 0) > 0;

                if (hasVariants && isHovered && ball.imageSwitchTimer >= IMAGE_SWITCH_INTERVAL) {
                    ball.imageSwitchTimer = 0;
                    const total = 1 + altImages[ball.id]!.length;
                    ball.imageIndex = (ball.imageIndex + 1) % total;
                }

                if (hasVariants && !isHovered && ball.imageIndex !== 0) {
                    ball.imageIndex = 0;
                    ball.imageSwitchTimer = 0;
                }
            }

            applyRepulsion(balls);

            const sorted = [...balls].sort((a, b) => a.zIndex - b.zIndex);

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
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
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

            hoveredIdRef.current = found;
            container.style.cursor = found !== null ? 'pointer' : 'default';
        },
        [ballsRef, containerRef, hoveredIdRef]
    );

    const handleMouseLeave = useCallback(() => {
        hoveredIdRef.current = null;
        if (containerRef.current) containerRef.current.style.cursor = 'default';
    }, [containerRef, hoveredIdRef]);

    return { handleMouseMove, handleMouseLeave };
}
