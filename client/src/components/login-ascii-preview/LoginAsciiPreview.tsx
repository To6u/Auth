import { useEffect, useRef } from 'react';

// ─── Grid ──────────────────────────────────────────────────────────────────
const COLS = 20;
const ROWS = 10;

// ─── Timing ────────────────────────────────────────────────────────────────
const SCENE_HOLD_MS = 2800;
const TRANSITION_MS = 650;

// ─── Glitch ────────────────────────────────────────────────────────────────
const GLITCH_CHARS = '▒░─│/|\\^~<>!?@#';

// ─── Colors ────────────────────────────────────────────────────────────────
const C_BORDER = 'rgba(255,255,255,0.18)';
const C_INPUT = 'rgba(165,167,255,0.38)';
const C_BUTTON = 'rgba(99,102,241,0.72)';
const C_ACTIVE = 'rgba(165,167,255,0.92)';
const C_BRACKET = 'rgba(165,167,255,0.65)';
const C_TEXT = 'rgba(255,255,255,0.28)';
const C_GLITCH = 'rgba(99,102,241,0.88)';

const BORDER_SET = new Set([...'─│┌┐└┘├┤']);

// Returns true for each char position that is between [ and ] in the row
function bracketMask(row: readonly string[]): boolean[] {
    const joined = row.join('');
    const open = joined.indexOf('[');
    const close = joined.indexOf(']');
    const mask = new Array<boolean>(row.length).fill(false);
    if (open !== -1 && close !== -1) {
        for (let i = open + 1; i < close; i++) mask[i] = true;
    }
    return mask;
}

function charColor(ch: string, inBracket: boolean): string {
    if (BORDER_SET.has(ch)) return C_BORDER;
    if (ch === '░') return C_INPUT;
    if (ch === '▓') return C_BUTTON;
    if (ch === '[' || ch === ']') return C_BRACKET;
    if (inBracket) return C_ACTIVE;
    return C_TEXT;
}

// ─── Scenes (each row must be exactly COLS = 20 chars) ─────────────────────
//
// Inner width between │ = 18 chars.
// Input field  : sp + 15×░ + 2×sp  = 18 ✓
// Button row   : 2×sp + 14×▓ + 2×sp = 18 ✓

const SCENES: readonly (readonly string[])[] = [
    // 0 — Login (2 fields)
    [
        '┌──────────────────┐',
        '│[LOGIN] REG   PWD │',
        '├──────────────────┤',
        '│                  │',
        '│ ░░░░░░░░░░░░░░░  │',
        '│                  │',
        '│ ░░░░░░░░░░░░░░░  │',
        '│                  │',
        '│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │',
        '└──────────────────┘',
    ],
    // 1 — Register (3 fields)
    [
        '┌──────────────────┐',
        '│ LOGIN  [REG] PWD │',
        '├──────────────────┤',
        '│ ░░░░░░░░░░░░░░░  │',
        '│                  │',
        '│ ░░░░░░░░░░░░░░░  │',
        '│                  │',
        '│ ░░░░░░░░░░░░░░░  │',
        '│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │',
        '└──────────────────┘',
    ],
    // 2 — Forgot password (1 field)
    [
        '┌──────────────────┐',
        '│ LOGIN   REG [PWD]│',
        '├──────────────────┤',
        '│                  │',
        '│ ░░░░░░░░░░░░░░░  │',
        '│                  │',
        '│                  │',
        '│                  │',
        '│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │',
        '└──────────────────┘',
    ],
] as const;

// ─── Component ─────────────────────────────────────────────────────────────

export const LoginAsciiPreview = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let raf = 0;
        let cancelled = false;

        // Mutable display state — rows of individual chars
        const display: string[][] = SCENES[0].map((row) => [...row]);
        let target: string[][] = display.map((row) => [...row]);

        // Per-cell glitch delay (ms after transitionStart before cell settles)
        // diagonal stagger: bias top-left → bottom-right, plus randomness
        let glitchDelay: number[][] = Array.from({ length: ROWS }, () =>
            new Array<number>(COLS).fill(0)
        );
        let sceneIdx = 0;
        let transitioning = false;
        let transitionStart = 0;
        let sceneTimer: ReturnType<typeof setTimeout> | undefined;

        // ── Canvas sizing (DPR-aware) ───────────────────────────────────────
        const dpr = Math.min(window.devicePixelRatio, 2);
        let canvasW = 0;
        let canvasH = 0;

        const resize = () => {
            canvasW = canvas.offsetWidth * dpr;
            canvasH = canvas.offsetHeight * dpr;
            canvas.width = canvasW;
            canvas.height = canvasH;
        };
        resize();

        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        // ── Draw ───────────────────────────────────────────────────────────
        const draw = (now: number) => {
            const ctx = canvas.getContext('2d');
            if (!ctx || canvasW === 0 || canvasH === 0) return;

            const cellW = canvasW / COLS;
            const cellH = canvasH / ROWS;
            const fontSize = Math.max(6, Math.floor(cellH * 0.72));

            ctx.clearRect(0, 0, canvasW, canvasH);
            ctx.font = `${fontSize}px 'JetBrains Mono','Fira Code',Menlo,monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const elapsed = transitioning ? now - transitionStart : 0;
            let allSettled = true;

            for (let r = 0; r < ROWS; r++) {
                const mask = bracketMask(display[r]!);
                const targetMask = bracketMask(target[r]!);

                for (let c = 0; c < COLS; c++) {
                    const cur = display[r]![c] ?? ' ';
                    const tgt = target[r]![c] ?? ' ';
                    let drawChar = cur;
                    let color: string;

                    if (transitioning && cur !== tgt) {
                        const delay = glitchDelay[r]![c] ?? 0;
                        const colElapsed = elapsed - delay;

                        if (colElapsed < 0) {
                            // Not yet started — show current
                            allSettled = false;
                            color = charColor(cur, mask[c] ?? false);
                        } else if (colElapsed < TRANSITION_MS * 0.55) {
                            // Glitching
                            allSettled = false;
                            const idx = Math.floor(Math.random() * GLITCH_CHARS.length);
                            drawChar = GLITCH_CHARS[idx] ?? '░';
                            color = C_GLITCH;
                        } else {
                            // Settled to target
                            display[r]![c] = tgt;
                            drawChar = tgt;
                            color = charColor(tgt, targetMask[c] ?? false);
                        }
                    } else {
                        color = charColor(cur, mask[c] ?? false);
                    }

                    if (drawChar === ' ') continue;
                    ctx.fillStyle = color;
                    ctx.fillText(drawChar, c * cellW + cellW * 0.5, r * cellH + cellH * 0.5);
                }
            }

            if (transitioning && allSettled) {
                transitioning = false;
                scheduleNext();
            }
        };

        // ── Transition ─────────────────────────────────────────────────────
        const startTransition = () => {
            sceneIdx = (sceneIdx + 1) % SCENES.length;
            target = SCENES[sceneIdx].map((row) => [...row]);

            // Diagonal stagger delay: 0..70% of TRANSITION_MS + small random jitter
            const MAX_DELAY = TRANSITION_MS * 0.45;
            glitchDelay = Array.from({ length: ROWS }, (_, r) =>
                Array.from({ length: COLS }, (_, c) => {
                    const progress = (c / (COLS - 1) + r / (ROWS - 1)) / 2;
                    return progress * MAX_DELAY + Math.random() * MAX_DELAY * 0.3;
                })
            );

            transitioning = true;
            transitionStart = performance.now();
        };

        const scheduleNext = () => {
            sceneTimer = setTimeout(startTransition, SCENE_HOLD_MS);
        };

        // ── Animation loop ─────────────────────────────────────────────────
        const loop = (now: number) => {
            if (cancelled) return;
            draw(now);
            raf = requestAnimationFrame(loop);
        };

        raf = requestAnimationFrame(loop);
        scheduleNext();

        return () => {
            cancelled = true;
            cancelAnimationFrame(raf);
            clearTimeout(sceneTimer);
            ro.disconnect();
        };
    }, []);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
};

export default LoginAsciiPreview;
