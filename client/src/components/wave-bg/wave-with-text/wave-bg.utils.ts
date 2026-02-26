import { WAVE_SPEED_MULTIPLIER, WAVE_WIDTH_MULTIPLIER } from './wavesConfigWebGL';
import type { WaveConfig } from './wavesConfigWebGL';
import type {
    WaveShaderProgram,
    LineShaderProgram,
    MouseState,
    TextLine,
} from '@/components/wave-bg/wave-with-text/wave-bg.types';
import { WAVE_VERTEX_SHADER, WAVE_FRAGMENT_SHADER, LINE_VERTEX_SHADER, LINE_FRAGMENT_SHADER } from './shaders';

// ==================== CONSTANTS ====================

export const MOUSE_CONFIG = {
    radius: 400,
    strength: 100,
    falloff: 2.5,
    smoothing: 0.1,
    fadeSpeed: 0.08,
    /** Порог scroll, выше которого mouse effect отключается */
    scrollCutoff: 0.8,
    strengthScale: 0.01,
} as const;

export const TEXT_CONFIG = {
    canvasWidth: 2400,
    canvasHeight: 440,
    lineSpacing: 13,
    fontSize: 540,
    morphDuration: 5000,
    lineWidth: 10,
    verticalPosition: 0.5,
    scale: 1,
} as const;

export const TEXT_COLORS = {
    base: [255 / 255, 244 / 150, 234 / 255, 1.0] as [number, number, number, number],
    fill: [0 / 150, 114 / 255, 209 / 255, 1.0] as [number, number, number, number],
};

export const WAVE_SCROLL_CONFIG = {
    startVerticalPosition: 0.5,
    endVerticalPosition: 0.02,
    targetLineWidth: 50,
    smoothing: 0.08,
    scrollRange: 0.9,
} as const;

/** Границы сканирования пикселей при растеризации текста */
const SCAN_X_MIN = 300;
const SCAN_X_MAX = 2500;
const ALPHA_THRESHOLD = 128;

/** Порог активности мыши */
const MOUSE_ACTIVE_THRESHOLD = 0.01;

// ==================== MATH ====================

export const lerp = (current: number, target: number, factor: number): number => current + (target - current) * factor;

export const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ==================== WEBGL HELPERS ====================

const compileShader = (gl: WebGLRenderingContext, source: string, type: number): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
};

const linkProgram = (gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram | null => {
    const vertexShader = compileShader(gl, vs, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fs, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
};

export const createWaveProgram = (gl: WebGLRenderingContext): WaveShaderProgram | null => {
    const program = linkProgram(gl, WAVE_VERTEX_SHADER, WAVE_FRAGMENT_SHADER);
    if (!program) return null;

    return {
        program,
        locations: {
            position: gl.getAttribLocation(program, 'a_position'),
            gradient: gl.getUniformLocation(program, 'u_gradient'),
            gradientEnd: gl.getUniformLocation(program, 'u_gradientEnd'),
            tint: gl.getUniformLocation(program, 'u_tint'),
            resolution: gl.getUniformLocation(program, 'u_resolution'),
            time: gl.getUniformLocation(program, 'u_time'),
            refractionStrength: gl.getUniformLocation(program, 'u_refractionStrength'),
            chromaticAberration: gl.getUniformLocation(program, 'u_chromaticAberration'),
        },
    };
};

export const createLineProgram = (gl: WebGLRenderingContext): LineShaderProgram | null => {
    const program = linkProgram(gl, LINE_VERTEX_SHADER, LINE_FRAGMENT_SHADER);
    if (!program) return null;

    return {
        program,
        locations: {
            position: gl.getAttribLocation(program, 'a_position'),
            color: gl.getAttribLocation(program, 'a_color'),
            u: gl.getAttribLocation(program, 'a_u'),
            v: gl.getAttribLocation(program, 'a_v'),
            resolution: gl.getUniformLocation(program, 'u_resolution'),
            opacity: gl.getUniformLocation(program, 'u_opacity'),
        },
    };
};

// ==================== WAVE GEOMETRY ====================

export const fillWaveVertices = (
    buffer: Float32Array,
    width: number,
    height: number,
    wave: WaveConfig,
    time: number,
    step: number,
    mouse: MouseState,
    dpr: number,
    scrollProgress = 0
): number => {
    const { startVerticalPosition, endVerticalPosition, targetLineWidth } = WAVE_SCROLL_CONFIG;

    const phase = wave.phase + time * wave.speed * WAVE_SPEED_MULTIPLIER;
    const verticalPosition = startVerticalPosition - scrollProgress * (startVerticalPosition - endVerticalPosition);
    const verticalMovement = wave.verticalSpeed * Math.sin(time * 0.001) * (1 - scrollProgress);
    const baseY = height * verticalPosition + verticalMovement;
    const amplitudeFactor = 1 - scrollProgress * 0.7;
    const tiltFactor = 1 - scrollProgress;

    const mouseX = mouse.smoothX * dpr;
    const mouseY = mouse.smoothY * dpr;
    const sigma = (MOUSE_CONFIG.radius * dpr) / MOUSE_CONFIG.falloff;
    const hasMouseEffect = mouse.smoothActive > MOUSE_ACTIVE_THRESHOLD && scrollProgress < MOUSE_CONFIG.scrollCutoff;
    const mouseInfluenceFactor = 1 - scrollProgress;

    let idx = 0;

    for (let x = 0; x <= width; x += step) {
        let y = baseY + Math.sin(x * wave.frequency + phase) * wave.amplitude * amplitudeFactor;

        if (wave.tilt) {
            const tiltPhase = time * wave.tilt.speed * WAVE_SPEED_MULTIPLIER;
            y += Math.sin(x * wave.tilt.frequency + tiltPhase) * wave.tilt.amplitude * height * tiltFactor;
        }

        if (hasMouseEffect) {
            const dx = x - mouseX;
            const gaussian = Math.exp(-(dx * dx) / (2 * sigma * sigma));
            const strength = MOUSE_CONFIG.strength * dpr * gaussian * mouse.smoothActive * mouseInfluenceFactor;
            y += (mouseY - y) * strength * MOUSE_CONFIG.strengthScale;
        }

        const interpolatedWidth = wave.lineWidth + (targetLineWidth - wave.lineWidth) * scrollProgress;
        let halfWidth = interpolatedWidth * WAVE_WIDTH_MULTIPLIER;

        if (wave.widthModulation) {
            const modulationStrength = 1 - scrollProgress * 0.8;
            const wPhase = time * wave.widthModulation.speed * WAVE_SPEED_MULTIPLIER;
            const mod =
                Math.sin(x * wave.widthModulation.frequency + wPhase) *
                wave.widthModulation.amplitude *
                modulationStrength;
            halfWidth *= 1 + mod;
        }

        halfWidth /= 2;

        buffer[idx++] = x;
        buffer[idx++] = y - halfWidth;
        buffer[idx++] = x;
        buffer[idx++] = y + halfWidth;
    }

    return idx / 2;
};

export const updateMouseState = (mouse: MouseState): void => {
    mouse.smoothX = lerp(mouse.smoothX, mouse.x, MOUSE_CONFIG.smoothing);
    mouse.smoothY = lerp(mouse.smoothY, mouse.y, MOUSE_CONFIG.smoothing);
    mouse.smoothActive = lerp(mouse.smoothActive, mouse.active ? 1 : 0, MOUSE_CONFIG.fadeSpeed);
};

// ==================== VERTEX BUFFER HELPERS ====================

/**
 * Пишет quad (2 треугольника) в data начиная с idx, возвращает новый idx.
 * u1/u2 — позиция вдоль линии [0..1], v — поперёк [-1..1].
 * Формат вершины: x, y, r, g, b, a, u, v  (8 floats)
 */
export const pushQuad = (
    data: Float32Array,
    idx: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    halfW: number,
    color: [number, number, number, number],
    u1: number,
    u2: number
): number => {
    const [r, g, b, a] = color;

    // v = -1 верхний край, v = +1 нижний край
    data[idx++] = x1;
    data[idx++] = y1 - halfW;
    data[idx++] = r;
    data[idx++] = g;
    data[idx++] = b;
    data[idx++] = a;
    data[idx++] = u1;
    data[idx++] = -1;
    data[idx++] = x2;
    data[idx++] = y2 - halfW;
    data[idx++] = r;
    data[idx++] = g;
    data[idx++] = b;
    data[idx++] = a;
    data[idx++] = u2;
    data[idx++] = -1;
    data[idx++] = x1;
    data[idx++] = y1 + halfW;
    data[idx++] = r;
    data[idx++] = g;
    data[idx++] = b;
    data[idx++] = a;
    data[idx++] = u1;
    data[idx++] = 1;

    data[idx++] = x1;
    data[idx++] = y1 + halfW;
    data[idx++] = r;
    data[idx++] = g;
    data[idx++] = b;
    data[idx++] = a;
    data[idx++] = u1;
    data[idx++] = 1;
    data[idx++] = x2;
    data[idx++] = y2 - halfW;
    data[idx++] = r;
    data[idx++] = g;
    data[idx++] = b;
    data[idx++] = a;
    data[idx++] = u2;
    data[idx++] = -1;
    data[idx++] = x2;
    data[idx++] = y2 + halfW;
    data[idx++] = r;
    data[idx++] = g;
    data[idx++] = b;
    data[idx++] = a;
    data[idx++] = u2;
    data[idx++] = 1;

    return idx;
};

// ==================== TEXT GENERATION ====================

const createTextCanvas = (text: string, x: number, y: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = TEXT_CONFIG.canvasWidth + 400;
    canvas.height = TEXT_CONFIG.canvasHeight + 100;

    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
    if (!ctx) throw new Error('Canvas context not available');

    ctx.font = `${TEXT_CONFIG.fontSize}px Ganxy`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '-30px';
    ctx.fillText(text, x, y);

    return canvas;
};

const extractHorizontalLines = (
    imageData: Uint8ClampedArray,
    width: number,
    height: number
): Array<{ y: number; x1: number; x2: number }> => {
    const lines: Array<{ y: number; x1: number; x2: number }> = [];

    for (let y = 0; y < height; y += TEXT_CONFIG.lineSpacing) {
        let lineStart = -1;

        for (let x = SCAN_X_MIN; x < SCAN_X_MAX; x++) {
            const alpha = imageData[(y * width + x) * 4 + 3];

            if (alpha > ALPHA_THRESHOLD) {
                if (lineStart === -1) lineStart = x;
            } else if (lineStart !== -1) {
                lines.push({ y, x1: lineStart, x2: x - 1 });
                lineStart = -1;
            }
        }

        if (lineStart !== -1) lines.push({ y, x1: lineStart, x2: SCAN_X_MAX - 1 });
    }

    return lines;
};

export const generateTextLines = async (): Promise<TextLine[]> => {
    if (document.fonts) {
        try {
            await document.fonts.load(`${TEXT_CONFIG.fontSize}px Ganxy`);
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    const velopCanvas = createTextCanvas('VELOP', 460, 250);
    const signCanvas = createTextCanvas('SIGN', 680, 250);

    const velopCtx = velopCanvas.getContext('2d', { willReadFrequently: true });
    const signCtx = signCanvas.getContext('2d', { willReadFrequently: true });

    if (!velopCtx) throw new Error('Canvas context not available for VELOP');
    if (!signCtx) throw new Error('Canvas context not available for SIGN');

    const velopLines = extractHorizontalLines(
        velopCtx.getImageData(0, 0, velopCanvas.width, velopCanvas.height).data,
        velopCanvas.width,
        velopCanvas.height
    );
    const signLines = extractHorizontalLines(
        signCtx.getImageData(0, 0, signCanvas.width, signCanvas.height).data,
        signCanvas.width,
        signCanvas.height
    );

    const maxLines = Math.max(velopLines.length, signLines.length);

    // Если длины сильно отличаются, строки повторяются через модуль — намеренно
    return Array.from({ length: maxLines }, (_, i) => {
        const v = velopLines[i % velopLines.length];
        const s = signLines[i % signLines.length];
        return {
            velopX1: v.x1,
            velopY1: v.y,
            velopX2: v.x2,
            velopY2: v.y,
            signX1: s.x1,
            signY1: s.y,
            signX2: s.x2,
            signY2: s.y,
        };
    });
};
