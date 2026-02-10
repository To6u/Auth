import { useEffect, useRef, useCallback, memo } from 'react';
import { wavesConfig, parsedWaveColors, WAVE_SPEED_MULTIPLIER, WAVE_WIDTH_MULTIPLIER } from './wavesConfigWebGL';
import type { WaveConfig } from './wavesConfigWebGL';
import './waves-canvas.css';

// ==================== TYPES ====================

interface WaveShaderProgram {
    program: WebGLProgram;
    locations: {
        position: number;
        gradient: WebGLUniformLocation | null;
        gradientEnd: WebGLUniformLocation | null;
        tint: WebGLUniformLocation | null;
        resolution: WebGLUniformLocation | null;
        time: WebGLUniformLocation | null;
        refractionStrength: WebGLUniformLocation | null;
        chromaticAberration: WebGLUniformLocation | null;
    };
}

interface LineShaderProgram {
    program: WebGLProgram;
    locations: {
        position: number;
        color: number;
        resolution: WebGLUniformLocation | null;
    };
}

interface MouseState {
    x: number;
    y: number;
    smoothX: number;
    smoothY: number;
    active: boolean;
    smoothActive: number;
}

interface TextLine {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    // VELOP coords
    velopX1: number;
    velopY1: number;
    velopX2: number;
    velopY2: number;
    // SIGN coords
    signX1: number;
    signY1: number;
    signX2: number;
    signY2: number;
}

// ==================== CONSTANTS ====================

const MOUSE_CONFIG = {
    radius: 400,
    strength: 100,
    falloff: 2.5,
    smoothing: 0.1,
    fadeSpeed: 0.08,
};

const TEXT_CONFIG = {
    canvasWidth: 2400,
    canvasHeight: 440,
    lineSpacing: 15,
    fontSize: 540,
    morphDuration: 5000,
    lineWidth: 4,
    // Позиция текста относительно экрана (0-1)
    verticalPosition: 0.5,
    scale: 1, // Масштаб текста относительно ширины экрана
};

// Цвета текста
const TEXT_COLORS = {
    base: [229 / 255, 255 / 255, 171 / 255, 1.0] as [number, number, number, number], // #E5FFAB
    fill: [107 / 255, 159 / 255, 255 / 255, 1.0] as [number, number, number, number], // #6B9FFF
};

// ==================== SHADERS ====================

const WAVE_VERTEX_SHADER = `
    precision mediump float;
    attribute vec2 a_position;
    uniform vec2 u_resolution;
    varying vec2 v_position;
    varying float v_gradientPos;

    void main() {
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
        v_position = a_position;
        v_gradientPos = a_position.x / u_resolution.x;
    }
`;

const WAVE_FRAGMENT_SHADER = `
    #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
    #endif
    
    precision mediump float;
    uniform vec4 u_gradient;
    uniform vec4 u_gradientEnd;
    uniform vec4 u_tint;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_refractionStrength;
    uniform float u_chromaticAberration;
    
    varying vec2 v_position;
    varying float v_gradientPos;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    void main() {
        vec4 baseColor = mix(u_gradient, u_gradientEnd, v_gradientPos);
        
        if (u_refractionStrength < 0.1) {
            gl_FragColor = baseColor;
            return;
        }
        
        vec2 noiseCoord = v_position / u_resolution * 3.0 + u_time * 0.0001;
        float noise = snoise(noiseCoord * 2.0) * 0.5 + snoise(noiseCoord * 4.0) * 0.25;
        
        vec3 color = baseColor.rgb;
        if (u_chromaticAberration > 0.0) {
            float shift = noise * u_chromaticAberration * 0.02;
            color.r += shift;
            color.b -= shift;
        }
        
        #ifdef GL_OES_standard_derivatives
        vec2 grad = vec2(dFdx(v_position.y), dFdy(v_position.y));
        float fresnel = pow(1.0 - min(length(grad) * 50.0, 1.0), 2.0);
        #else
        float fresnel = 0.2;
        #endif
        
        color += vec3(fresnel) * 0.3;
        color *= 1.0 + noise * u_refractionStrength * 0.01;
        color = mix(color, u_tint.rgb, u_tint.a * 0.15);
        
        gl_FragColor = vec4(color, baseColor.a);
    }
`;

// Простой шейдер для линий текста
const LINE_VERTEX_SHADER = `
    precision mediump float;
    attribute vec2 a_position;
    attribute vec4 a_color;
    uniform vec2 u_resolution;
    varying vec4 v_color;

    void main() {
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
        v_color = a_color;
    }
`;

const LINE_FRAGMENT_SHADER = `
    precision mediump float;
    varying vec4 v_color;

    void main() {
        gl_FragColor = v_color;
    }
`;

// ==================== UTILITY FUNCTIONS ====================

const lerp = (current: number, target: number, factor: number): number => {
    return current + (target - current) * factor;
};

const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const lerpColor = (
    color1: [number, number, number, number],
    color2: [number, number, number, number],
    t: number
): [number, number, number, number] => {
    return [
        color1[0] + (color2[0] - color1[0]) * t,
        color1[1] + (color2[1] - color1[1]) * t,
        color1[2] + (color2[2] - color1[2]) * t,
        color1[3] + (color2[3] - color1[3]) * t,
    ];
};

// ==================== TEXT GENERATION ====================

const createTextCanvas = (text: string, x: number, y: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = TEXT_CONFIG.canvasWidth + 400;
    canvas.height = TEXT_CONFIG.canvasHeight + 100;

    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
    if (!ctx) throw new Error('Canvas context not available');

    ctx.font = `italic 900 ${TEXT_CONFIG.fontSize}px Inter, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '-40px';
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

        for (let x = 300; x < 2500; x++) {
            const index = (y * width + x) * 4;
            const alpha = imageData[index + 3];

            if (alpha > 128) {
                if (lineStart === -1) lineStart = x;
            } else if (lineStart !== -1) {
                lines.push({ y, x1: lineStart, x2: x - 1 });
                lineStart = -1;
            }
        }

        if (lineStart !== -1) {
            lines.push({ y, x1: lineStart, x2: 2499 });
        }
    }

    return lines;
};

const generateTextLines = async (): Promise<TextLine[]> => {
    // Ждём загрузки шрифта
    if (document.fonts) {
        try {
            await document.fonts.load(`italic 900 ${TEXT_CONFIG.fontSize}px Inter`);
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    const velopCanvas = createTextCanvas('VELOP', 360, 250);
    const velopCtx = velopCanvas.getContext('2d');
    if (!velopCtx) return [];

    const signCanvas = createTextCanvas('SIGN', 580, 250);
    const signCtx = signCanvas.getContext('2d');
    if (!signCtx) return [];

    const velopImageData = velopCtx.getImageData(0, 0, velopCanvas.width, velopCanvas.height);
    const signImageData = signCtx.getImageData(0, 0, signCanvas.width, signCanvas.height);

    const velopLines = extractHorizontalLines(velopImageData.data, velopCanvas.width, velopCanvas.height);
    const signLines = extractHorizontalLines(signImageData.data, signCanvas.width, signCanvas.height);

    const maxLines = Math.max(velopLines.length, signLines.length);
    const lines: TextLine[] = [];

    for (let i = 0; i < maxLines; i++) {
        const velopLine = velopLines[i % velopLines.length];
        const signLine = signLines[i % signLines.length];

        lines.push({
            x1: velopLine.x1,
            y1: velopLine.y,
            x2: velopLine.x2,
            y2: velopLine.y,
            velopX1: velopLine.x1,
            velopY1: velopLine.y,
            velopX2: velopLine.x2,
            velopY2: velopLine.y,
            signX1: signLine.x1,
            signY1: signLine.y,
            signX2: signLine.x2,
            signY2: signLine.y,
        });
    }

    return lines;
};

// ==================== WAVE FUNCTIONS ====================

const calculateWaveY = (
    x: number,
    wave: WaveConfig,
    time: number,
    height: number,
    mouse: MouseState,
    dpr: number
): number => {
    const phase = wave.phase + time * wave.speed * WAVE_SPEED_MULTIPLIER;
    const baseY = height * 0.5 + wave.verticalSpeed * Math.sin(time * 0.001);

    let y = baseY + Math.sin(x * wave.frequency + phase) * wave.amplitude;

    if (wave.tilt) {
        const tiltPhase = time * wave.tilt.speed * WAVE_SPEED_MULTIPLIER;
        const tiltOffset = Math.sin(x * wave.tilt.frequency + tiltPhase) * wave.tilt.amplitude * height;
        y += tiltOffset;
    }

    if (mouse.smoothActive > 0.01) {
        const mouseX = mouse.smoothX * dpr;
        const mouseY = mouse.smoothY * dpr;
        const radius = MOUSE_CONFIG.radius * dpr;
        const sigma = radius / MOUSE_CONFIG.falloff;

        const dx = x - mouseX;
        const distanceX = Math.abs(dx);

        const gaussian = Math.exp(-(distanceX * distanceX) / (2 * sigma * sigma));
        const strength = MOUSE_CONFIG.strength * dpr * gaussian * mouse.smoothActive;

        y += (mouseY - y) * strength * 0.01;
    }

    return y;
};

const calculateWaveWidth = (x: number, wave: WaveConfig, time: number): number => {
    const baseWidth = wave.lineWidth * WAVE_WIDTH_MULTIPLIER;

    if (!wave.widthModulation) {
        return baseWidth;
    }

    const phase = time * wave.widthModulation.speed * WAVE_SPEED_MULTIPLIER;
    const modulation = Math.sin(x * wave.widthModulation.frequency + phase) * wave.widthModulation.amplitude;

    return baseWidth * (1 + modulation);
};

const fillWaveVertices = (
    buffer: Float32Array,
    width: number,
    height: number,
    wave: WaveConfig,
    time: number,
    step: number,
    mouse: MouseState,
    dpr: number
): number => {
    let idx = 0;

    for (let x = 0; x <= width; x += step) {
        const y = calculateWaveY(x, wave, time, height, mouse, dpr);
        const halfWidth = calculateWaveWidth(x, wave, time) / 2;

        buffer[idx++] = x;
        buffer[idx++] = y - halfWidth;
        buffer[idx++] = x;
        buffer[idx++] = y + halfWidth;
    }

    return idx / 2;
};

// ==================== SHADER COMPILATION ====================

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

const createWaveProgram = (gl: WebGLRenderingContext): WaveShaderProgram | null => {
    const vertexShader = compileShader(gl, WAVE_VERTEX_SHADER, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, WAVE_FRAGMENT_SHADER, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    const locations = {
        position: gl.getAttribLocation(program, 'a_position'),
        gradient: gl.getUniformLocation(program, 'u_gradient'),
        gradientEnd: gl.getUniformLocation(program, 'u_gradientEnd'),
        tint: gl.getUniformLocation(program, 'u_tint'),
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        time: gl.getUniformLocation(program, 'u_time'),
        refractionStrength: gl.getUniformLocation(program, 'u_refractionStrength'),
        chromaticAberration: gl.getUniformLocation(program, 'u_chromaticAberration'),
    };

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return { program, locations };
};

const createLineProgram = (gl: WebGLRenderingContext): LineShaderProgram | null => {
    const vertexShader = compileShader(gl, LINE_VERTEX_SHADER, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, LINE_FRAGMENT_SHADER, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Line program link error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    const locations = {
        position: gl.getAttribLocation(program, 'a_position'),
        color: gl.getAttribLocation(program, 'a_color'),
        resolution: gl.getUniformLocation(program, 'u_resolution'),
    };

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return { program, locations };
};

// ==================== HELPER FUNCTIONS ====================

const calculateAdaptiveStep = (width: number): number => {
    return Math.max(8, Math.floor(width / 450));
};

const calculateBufferSize = (maxWidth: number, step: number): number => {
    return Math.ceil(maxWidth / step + 1) * 2 * 2;
};

const updateMouseState = (mouse: MouseState): void => {
    mouse.smoothX = lerp(mouse.smoothX, mouse.x, MOUSE_CONFIG.smoothing);
    mouse.smoothY = lerp(mouse.smoothY, mouse.y, MOUSE_CONFIG.smoothing);

    const targetActive = mouse.active ? 1 : 0;
    mouse.smoothActive = lerp(mouse.smoothActive, targetActive, MOUSE_CONFIG.fadeSpeed);
};

// ==================== MAIN COMPONENT ====================

const WavesWithText = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const waveProgramRef = useRef<WaveShaderProgram | null>(null);
    const lineProgramRef = useRef<LineShaderProgram | null>(null);
    const waveBufferRef = useRef<WebGLBuffer | null>(null);
    const lineBufferRef = useRef<WebGLBuffer | null>(null);
    const animationFrameRef = useRef<number>(0);
    const vertexBuffersRef = useRef<Float32Array[]>([]);
    const textLinesRef = useRef<TextLine[]>([]);
    const lineVertexBufferRef = useRef<Float32Array | null>(null);
    const isUnmountedRef = useRef(false);
    const dprRef = useRef(1);
    const mouseRef = useRef<MouseState>({
        x: 0,
        y: 0,
        smoothX: 0,
        smoothY: 0,
        active: false,
        smoothActive: 0,
    });

    // Состояние анимации текста
    const textAnimationRef = useRef({
        initialized: false,
        initialAnimationProgress: 0,
        initialAnimationComplete: false,
        morphProgress: 0,
        morphTarget: 0, // 0 = VELOP, 1 = SIGN
        lastMorphTime: 0,
        timerProgress: 0,
        exitProgress: 0,
        scrollY: 0,
        mouseInfluence: 1, // 1 = полное влияние мыши, 0 = нет влияния
    });

    // Рендер одной волны
    const renderWave = useCallback(
        (
            gl: WebGLRenderingContext,
            program: WaveShaderProgram,
            buffer: WebGLBuffer,
            vertices: Float32Array,
            vertexCount: number,
            waveIndex: number,
            time: number,
            width: number,
            height: number
        ) => {
            gl.useProgram(program.program);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices.subarray(0, vertexCount * 2), gl.DYNAMIC_DRAW);

            gl.enableVertexAttribArray(program.locations.position);
            gl.vertexAttribPointer(program.locations.position, 2, gl.FLOAT, false, 0, 0);

            gl.uniform2f(program.locations.resolution, width, height);
            gl.uniform1f(program.locations.time, time);

            const colors = parsedWaveColors[waveIndex];
            gl.uniform4fv(program.locations.gradient, colors.gradientStart);
            gl.uniform4fv(program.locations.gradientEnd, colors.gradientEnd);

            const wave = wavesConfig[waveIndex];
            if (wave.glassEffect) {
                gl.uniform4fv(program.locations.tint, colors.tint);
                gl.uniform1f(program.locations.refractionStrength, wave.glassEffect.refractionStrength);
                gl.uniform1f(program.locations.chromaticAberration, wave.glassEffect.chromaticAberration);
            } else {
                gl.uniform4f(program.locations.tint, 0, 0, 0, 0);
                gl.uniform1f(program.locations.refractionStrength, 0);
                gl.uniform1f(program.locations.chromaticAberration, 0);
            }

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
        },
        []
    );

    // Рендер текстовых линий
    const renderTextLines = useCallback(
        (
            gl: WebGLRenderingContext,
            program: LineShaderProgram,
            buffer: WebGLBuffer,
            width: number,
            height: number,
            time: number
        ) => {
            const lines = textLinesRef.current;
            const anim = textAnimationRef.current;

            if (lines.length === 0 || !anim.initialized) return;

            // Обновляем анимации
            // Начальная анимация
            if (!anim.initialAnimationComplete) {
                anim.initialAnimationProgress = Math.min(1, anim.initialAnimationProgress + 0.02);
                if (anim.initialAnimationProgress >= 0.995) {
                    anim.initialAnimationComplete = true;
                }
            }

            // Морфинг между словами
            if (anim.initialAnimationComplete) {
                if (time - anim.lastMorphTime > TEXT_CONFIG.morphDuration) {
                    anim.morphTarget = anim.morphTarget === 0 ? 1 : 0;
                    anim.lastMorphTime = time;
                    anim.timerProgress = 0;
                }

                // Плавный морфинг
                const morphSpeed = 0.015;
                if (anim.morphTarget === 1 && anim.morphProgress < 1) {
                    anim.morphProgress = Math.min(1, anim.morphProgress + morphSpeed);
                } else if (anim.morphTarget === 0 && anim.morphProgress > 0) {
                    anim.morphProgress = Math.max(0, anim.morphProgress - morphSpeed);
                }

                // Timer progress для градиента
                anim.timerProgress = Math.min(1, anim.timerProgress + 0.003);
            }

            // Масштаб и позиция текста
            const scale = (width / TEXT_CONFIG.canvasWidth) * TEXT_CONFIG.scale;
            const offsetX = (width - TEXT_CONFIG.canvasWidth * scale) / 2;
            const baseOffsetY = height * TEXT_CONFIG.verticalPosition - (TEXT_CONFIG.canvasHeight * scale) / 2;

            // Вычисляем exitProgress на основе скролла
            const scrollY = anim.scrollY;
            const viewportHeight = height / dprRef.current;
            // Когда скроллим вниз — линии разъезжаются
            const scrollProgress = Math.max(0, Math.min(1, scrollY / (viewportHeight * 0.5)));
            anim.exitProgress = lerp(anim.exitProgress, scrollProgress, 0.1);

            // Смещение текста вверх при скролле
            const scrollOffsetY = -anim.exitProgress * height * 0.6;
            const offsetY = baseOffsetY + scrollOffsetY;

            // Плавное отключение влияния мыши когда текст уходит вверх
            const targetMouseInfluence = anim.exitProgress > 0.3 ? Math.max(0, 1 - (anim.exitProgress - 0.3) / 0.4) : 1;
            anim.mouseInfluence = lerp(anim.mouseInfluence, targetMouseInfluence, 0.1);

            // Заполняем буфер линий
            // Каждая линия = 3 слоя (chromatic) × 2 треугольника = 18 вершин, каждая вершина = x, y, r, g, b, a
            const layersPerLine = 3;
            const verticesPerLine = 6 * layersPerLine;
            const floatsPerVertex = 6;
            const totalFloats = lines.length * verticesPerLine * floatsPerVertex;

            if (!lineVertexBufferRef.current || lineVertexBufferRef.current.length < totalFloats) {
                lineVertexBufferRef.current = new Float32Array(totalFloats);
            }

            const data = lineVertexBufferRef.current;
            let idx = 0;

            const lineHalfWidth = (TEXT_CONFIG.lineWidth * scale) / 2;

            lines.forEach((line, index) => {
                // Вычисляем текущую позицию с морфингом
                const lineDelay = (index / lines.length) * 0.15;
                const adjustedProgress = Math.max(0, Math.min(1, (anim.morphProgress - lineDelay) / (1 - lineDelay)));
                const eased = easeInOutCubic(adjustedProgress);

                let x1: number, y1: number, x2: number, y2: number;

                if (!anim.initialAnimationComplete) {
                    // Начальная анимация — линии въезжают
                    const direction = index % 2 === 0 ? 1 : -1;
                    const progress = easeInOutCubic(anim.initialAnimationProgress);
                    x1 = line.velopX1 - direction * 800 * (1 - progress);
                    x2 = line.velopX2 - direction * 800 * (1 - progress);
                    y1 = line.velopY1;
                    y2 = line.velopY2;
                } else {
                    // Морфинг между VELOP и SIGN
                    x1 = line.velopX1 + (line.signX1 - line.velopX1) * eased;
                    y1 = line.velopY1 + (line.signY1 - line.velopY1) * eased;
                    x2 = line.velopX2 + (line.signX2 - line.velopX2) * eased;
                    y2 = line.velopY2 + (line.signY2 - line.velopY2) * eased;

                    // Wave эффект при морфинге
                    const waveFactor = Math.sin(adjustedProgress * Math.PI);
                    const waveOffset = waveFactor * 5 * (index % 2 === 0 ? 1 : -1);
                    y1 += waveOffset;
                    y2 += waveOffset;
                }

                // Трансформируем координаты
                x1 = x1 * scale + offsetX;
                x2 = x2 * scale + offsetX;
                y1 = y1 * scale + offsetY;
                y2 = y2 * scale + offsetY;

                // Разъезжание при скролле
                if (anim.exitProgress > 0.01) {
                    const spreadDirection = index % 2 === 0 ? -1 : 1;
                    const spreadDistance = anim.exitProgress * 800 * scale;
                    const spreadEasing = anim.exitProgress * anim.exitProgress;
                    const finalSpreadX = spreadDirection * spreadDistance * (1 + spreadEasing);

                    x1 += finalSpreadX;
                    x2 += finalSpreadX;
                }

                // Цвет линии — градиент от base к fill
                const normalizedY = (y1 - offsetY) / (TEXT_CONFIG.canvasHeight * scale);
                const gradientZone = 0.2;
                const timerProgress = anim.timerProgress;
                const isSign = anim.morphProgress >= 0.5;

                let color: [number, number, number, number];

                const effectiveY = isSign ? 1 - normalizedY : normalizedY;

                if (effectiveY <= timerProgress - gradientZone) {
                    color = TEXT_COLORS.fill;
                } else if (effectiveY <= timerProgress + gradientZone) {
                    const t = (timerProgress + gradientZone - effectiveY) / (gradientZone * 2);
                    color = lerpColor(TEXT_COLORS.base, TEXT_COLORS.fill, Math.max(0, Math.min(1, t)));
                } else {
                    color = TEXT_COLORS.base;
                }

                // Динамическая толщина при морфинге
                const morphPhase = Math.sin(adjustedProgress * Math.PI);
                const dynamicHalfWidth = lineHalfWidth * (1 + morphPhase * 0.3);

                // ===== ЭФФЕКТ ИСЧЕЗНОВЕНИЯ =====
                const fadeStart = 0.2; // когда начинается fade
                const adjustedExit = Math.max(0, (anim.exitProgress - fadeStart) / (1 - fadeStart));

                // Если скролл маленький — рендерим обычные линии
                if (adjustedExit < 0.01) {
                    // Обычный рендер без эффектов исчезновения
                    // Треугольник 1
                    data[idx++] = x1;
                    data[idx++] = y1 - dynamicHalfWidth;
                    data[idx++] = color[0];
                    data[idx++] = color[1];
                    data[idx++] = color[2];
                    data[idx++] = color[3];

                    data[idx++] = x2;
                    data[idx++] = y2 - dynamicHalfWidth;
                    data[idx++] = color[0];
                    data[idx++] = color[1];
                    data[idx++] = color[2];
                    data[idx++] = color[3];

                    data[idx++] = x1;
                    data[idx++] = y1 + dynamicHalfWidth;
                    data[idx++] = color[0];
                    data[idx++] = color[1];
                    data[idx++] = color[2];
                    data[idx++] = color[3];

                    // Треугольник 2
                    data[idx++] = x1;
                    data[idx++] = y1 + dynamicHalfWidth;
                    data[idx++] = color[0];
                    data[idx++] = color[1];
                    data[idx++] = color[2];
                    data[idx++] = color[3];

                    data[idx++] = x2;
                    data[idx++] = y2 - dynamicHalfWidth;
                    data[idx++] = color[0];
                    data[idx++] = color[1];
                    data[idx++] = color[2];
                    data[idx++] = color[3];

                    data[idx++] = x2;
                    data[idx++] = y2 + dynamicHalfWidth;
                    data[idx++] = color[0];
                    data[idx++] = color[1];
                    data[idx++] = color[2];
                    data[idx++] = color[3];

                    return;
                }

                // Stagger fade — линии исчезают волной сверху вниз
                const normalizedIndex = index / lines.length;
                const staggerDelay = normalizedIndex * 0.4; // 0-0.4 задержка
                const lineFade = Math.max(0, Math.min(1, 1 - (adjustedExit - staggerDelay) / (1 - staggerDelay)));

                // Shrink — линии сужаются к центру при исчезновении
                const shrinkFactor = 0.3 + lineFade * 0.7; // от 100% до 30%
                const midX = (x1 + x2) / 2;
                const halfLength = ((x2 - x1) / 2) * shrinkFactor;
                x1 = midX - halfLength;
                x2 = midX + halfLength;

                // Уменьшаем толщину
                const fadedHalfWidth = dynamicHalfWidth * lineFade;

                // Пропускаем полностью исчезнувшие линии
                if (lineFade < 0.01) return;

                // Chromatic split — разделение на RGB при исчезновении
                const chromaticAmount = (1 - lineFade) * 15 * scale; // макс смещение
                const spreadDir = index % 2 === 0 ? 1 : -1;
                const chromaticAlpha = (1 - lineFade) * 0.7; // alpha для chromatic слоёв

                // Создаём 3 слоя: Red, основной, Blue
                const layers = [
                    { offset: -chromaticAmount * spreadDir, color: [color[0], 0, 0, color[3] * chromaticAlpha] }, // Red
                    { offset: 0, color: [color[0], color[1], color[2], color[3] * lineFade] }, // Main (faded)
                    { offset: chromaticAmount * spreadDir, color: [0, 0, color[2], color[3] * chromaticAlpha] }, // Blue
                ];

                layers.forEach((layer) => {
                    const lx1 = x1 + layer.offset;
                    const lx2 = x2 + layer.offset;
                    const lColor = layer.color as [number, number, number, number];

                    // Треугольник 1
                    data[idx++] = lx1;
                    data[idx++] = y1 - fadedHalfWidth;
                    data[idx++] = lColor[0];
                    data[idx++] = lColor[1];
                    data[idx++] = lColor[2];
                    data[idx++] = lColor[3];

                    data[idx++] = lx2;
                    data[idx++] = y2 - fadedHalfWidth;
                    data[idx++] = lColor[0];
                    data[idx++] = lColor[1];
                    data[idx++] = lColor[2];
                    data[idx++] = lColor[3];

                    data[idx++] = lx1;
                    data[idx++] = y1 + fadedHalfWidth;
                    data[idx++] = lColor[0];
                    data[idx++] = lColor[1];
                    data[idx++] = lColor[2];
                    data[idx++] = lColor[3];

                    // Треугольник 2
                    data[idx++] = lx1;
                    data[idx++] = y1 + fadedHalfWidth;
                    data[idx++] = lColor[0];
                    data[idx++] = lColor[1];
                    data[idx++] = lColor[2];
                    data[idx++] = lColor[3];

                    data[idx++] = lx2;
                    data[idx++] = y2 - fadedHalfWidth;
                    data[idx++] = lColor[0];
                    data[idx++] = lColor[1];
                    data[idx++] = lColor[2];
                    data[idx++] = lColor[3];

                    data[idx++] = lx2;
                    data[idx++] = y2 + fadedHalfWidth;
                    data[idx++] = lColor[0];
                    data[idx++] = lColor[1];
                    data[idx++] = lColor[2];
                    data[idx++] = lColor[3];
                });
            });

            // Рендерим
            gl.useProgram(program.program);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, idx), gl.DYNAMIC_DRAW);

            const stride = floatsPerVertex * 4; // 6 floats × 4 bytes

            gl.enableVertexAttribArray(program.locations.position);
            gl.vertexAttribPointer(program.locations.position, 2, gl.FLOAT, false, stride, 0);

            gl.enableVertexAttribArray(program.locations.color);
            gl.vertexAttribPointer(program.locations.color, 4, gl.FLOAT, false, stride, 2 * 4);

            gl.uniform2f(program.locations.resolution, width, height);

            const totalVertices = idx / floatsPerVertex;
            gl.drawArrays(gl.TRIANGLES, 0, totalVertices);
        },
        []
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        isUnmountedRef.current = false;

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

        glRef.current = gl;
        gl.getExtension('OES_standard_derivatives');

        // Создаём шейдерные программы
        const waveProgram = createWaveProgram(gl);
        const lineProgram = createLineProgram(gl);

        if (!waveProgram || !lineProgram) return;

        waveProgramRef.current = waveProgram;
        lineProgramRef.current = lineProgram;
        waveBufferRef.current = gl.createBuffer();
        lineBufferRef.current = gl.createBuffer();

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Инициализируем буферы волн
        const initBuffers = (width: number) => {
            const step = calculateAdaptiveStep(width);
            const bufferSize = calculateBufferSize(width, step);

            vertexBuffersRef.current = wavesConfig.map(() => new Float32Array(bufferSize));
        };

        const resize = () => {
            if (isUnmountedRef.current) return;

            const dpr = Math.min(window.devicePixelRatio, 2);
            dprRef.current = dpr;

            const width = window.innerWidth * dpr;
            const height = window.innerHeight * dpr;

            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, width, height);

            initBuffers(width);
        };

        resize();

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(document.body);

        // Загружаем текстовые линии
        generateTextLines().then((lines) => {
            textLinesRef.current = lines;
            textAnimationRef.current.initialized = true;
            textAnimationRef.current.lastMorphTime = performance.now();
        });

        // Обработчики мыши
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
            mouseRef.current.active = true;
        };

        const handleMouseLeave = () => {
            mouseRef.current.active = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);

        // Обработчик скролла
        const handleScroll = () => {
            textAnimationRef.current.scrollY = window.scrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        const animate = (time: number) => {
            if (
                isUnmountedRef.current ||
                !waveProgramRef.current ||
                !lineProgramRef.current ||
                !waveBufferRef.current ||
                !lineBufferRef.current
            )
                return;

            updateMouseState(mouseRef.current);

            const { width, height } = canvas;
            const step = calculateAdaptiveStep(width);
            const mouse = mouseRef.current;
            const dpr = dprRef.current;

            // Получаем влияние мыши с учётом скролла
            const mouseInfluence = textAnimationRef.current.mouseInfluence;

            // Создаём эффективное состояние мыши с учётом влияния
            const effectiveMouse: MouseState = {
                ...mouse,
                smoothActive: mouse.smoothActive * mouseInfluence,
            };

            gl.clear(gl.COLOR_BUFFER_BIT);

            // 1. Рендерим первую волну (дальняя, index 0)
            const buffer0 = vertexBuffersRef.current[0];
            if (buffer0) {
                const vertexCount0 = fillWaveVertices(
                    buffer0,
                    width,
                    height,
                    wavesConfig[0],
                    time,
                    step,
                    effectiveMouse,
                    dpr
                );
                renderWave(
                    gl,
                    waveProgramRef.current!,
                    waveBufferRef.current!,
                    buffer0,
                    vertexCount0,
                    0,
                    time,
                    width,
                    height
                );
            }

            // 2. Рендерим текст (между первой и второй волной)
            renderTextLines(gl, lineProgramRef.current!, lineBufferRef.current!, width, height, time);

            // 3. Рендерим остальные волны (средняя и ближняя, index 1, 2)
            for (let i = 1; i < wavesConfig.length; i++) {
                const buffer = vertexBuffersRef.current[i];
                if (buffer) {
                    const vertexCount = fillWaveVertices(
                        buffer,
                        width,
                        height,
                        wavesConfig[i],
                        time,
                        step,
                        effectiveMouse,
                        dpr
                    );
                    renderWave(
                        gl,
                        waveProgramRef.current!,
                        waveBufferRef.current!,
                        buffer,
                        vertexCount,
                        i,
                        time,
                        width,
                        height
                    );
                }
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            isUnmountedRef.current = true;

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = 0;
            }

            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('scroll', handleScroll);

            resizeObserver.disconnect();

            if (waveProgramRef.current && glRef.current) {
                glRef.current.deleteProgram(waveProgramRef.current.program);
                waveProgramRef.current = null;
            }

            if (lineProgramRef.current && glRef.current) {
                glRef.current.deleteProgram(lineProgramRef.current.program);
                lineProgramRef.current = null;
            }

            if (waveBufferRef.current && glRef.current) {
                glRef.current.deleteBuffer(waveBufferRef.current);
                waveBufferRef.current = null;
            }

            if (lineBufferRef.current && glRef.current) {
                glRef.current.deleteBuffer(lineBufferRef.current);
                lineBufferRef.current = null;
            }

            glRef.current = null;
            vertexBuffersRef.current = [];
            lineVertexBufferRef.current = null;
        };
    }, [renderWave, renderTextLines]);

    return <canvas ref={canvasRef} className="waves-canvas" />;
});

export default WavesWithText;
