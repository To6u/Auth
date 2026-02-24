import { useEffect, useRef, memo } from 'react';
import { wavesConfig, parsedWaveColors, WAVE_SPEED_MULTIPLIER, WAVE_WIDTH_MULTIPLIER } from 'src/components/wave-bg/wave-with-text/wavesConfigWebGL.ts';
import type { WaveConfig } from 'src/components/wave-bg/wave-with-text/wavesConfigWebGL.ts';
import '@/components/wave-bg/wave-with-text/waves-canvas.css';

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

interface MouseState {
    // Текущая позиция курсора
    x: number;
    y: number;
    // Интерполированная позиция (для плавности)
    smoothX: number;
    smoothY: number;
    // Курсор над canvas
    active: boolean;
    // Интерполированная активность (0-1)
    smoothActive: number;
}

// Настройки притяжения к курсору
const MOUSE_CONFIG = {
    radius: 500, // Радиус влияния (px)
    strength: 50, // Сила притяжения
    falloff: 4, // Ширина Gaussian (меньше = уже воронка, больше = шире)
    smoothing: 0.1, // Скорость интерполяции позиции (0-1, меньше = плавнее)
    fadeSpeed: 0.08, // Скорость появления/исчезновения эффекта
};

// Vertex shader
const VERTEX_SHADER_SOURCE = `
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

// Fragment shader с процедурным glass эффектом
const FRAGMENT_SHADER_SOURCE = `
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

    // Simplex noise для процедурной текстуры
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

// Линейная интерполяция
const lerp = (current: number, target: number, factor: number): number => {
    return current + (target - current) * factor;
};

// Вычисление Y координаты волны с притяжением к курсору
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

    // Притяжение к курсору — Gaussian falloff для плавной деформации
    if (mouse.smoothActive > 0.01) {
        const mouseX = mouse.smoothX * dpr;
        const mouseY = mouse.smoothY * dpr;
        const radius = MOUSE_CONFIG.radius * dpr;
        const sigma = radius / MOUSE_CONFIG.falloff; // ширина "воронки"

        // Горизонтальное расстояние до курсора
        const dx = x - mouseX;
        const distanceX = Math.abs(dx);

        // Gaussian — плавный купол влияния
        const gaussian = Math.exp(-(distanceX * distanceX) / (2 * sigma * sigma));
        const strength = MOUSE_CONFIG.strength * dpr * gaussian * mouse.smoothActive;

        // Тянем к курсору по Y
        y += (mouseY - y) * strength * 0.01;
    }

    return y;
};

// Вычисление динамической толщины
const calculateWaveWidth = (x: number, wave: WaveConfig, time: number): number => {
    const baseWidth = wave.lineWidth * WAVE_WIDTH_MULTIPLIER;

    if (!wave.widthModulation) {
        return baseWidth;
    }

    const phase = time * wave.widthModulation.speed * WAVE_SPEED_MULTIPLIER;
    const modulation = Math.sin(x * wave.widthModulation.frequency + phase) * wave.widthModulation.amplitude;

    return baseWidth * (1 + modulation);
};

// Заполнение буфера вершин (без аллокации)
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

// Компиляция шейдера
const compileShader = (gl: WebGLRenderingContext, source: string, type: number): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) {
        console.error('Failed to create shader');
        return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        const shaderType = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
        console.error(`${shaderType} shader compilation error:`, info || 'Unknown error');
        gl.deleteShader(shader);
        return null;
    }

    return shader;
};

// Создание программы
const createShaderProgram = (gl: WebGLRenderingContext): WaveShaderProgram | null => {
    const vertexShader = compileShader(gl, VERTEX_SHADER_SOURCE, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, FRAGMENT_SHADER_SOURCE, gl.FRAGMENT_SHADER);

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

// Расчёт адаптивного шага для разных разрешений
const calculateAdaptiveStep = (width: number): number => {
    return Math.max(8, Math.floor(width / 450));
};

// Расчёт размера буфера для вершин
const calculateBufferSize = (maxWidth: number, step: number): number => {
    return Math.ceil(maxWidth / step + 1) * 2 * 2;
};

// Обновление состояния мыши с интерполяцией
const updateMouseState = (mouse: MouseState): void => {
    // Интерполяция позиции
    mouse.smoothX = lerp(mouse.smoothX, mouse.x, MOUSE_CONFIG.smoothing);
    mouse.smoothY = lerp(mouse.smoothY, mouse.y, MOUSE_CONFIG.smoothing);

    // Интерполяция активности
    const targetActive = mouse.active ? 1 : 0;
    mouse.smoothActive = lerp(mouse.smoothActive, targetActive, MOUSE_CONFIG.fadeSpeed);
};

const WavesBackgroundWebGL = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const programRef = useRef<WaveShaderProgram | null>(null);
    const bufferRef = useRef<WebGLBuffer | null>(null);
    const animationFrameRef = useRef<number>(0);
    const vertexBuffersRef = useRef<Float32Array[]>([]);
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

        const program = createShaderProgram(gl);
        if (!program) return;

        programRef.current = program;
        bufferRef.current = gl.createBuffer();

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(program.program);

        // Предаллоцируем буферы для вершин
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

        // Обработчики мыши — на window, т.к. canvas имеет z-index: -1
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

        const animate = (time: number) => {
            if (isUnmountedRef.current || !programRef.current || !bufferRef.current) return;

            // Обновляем интерполированное состояние мыши
            updateMouseState(mouseRef.current);

            const { width, height } = canvas;
            const step = calculateAdaptiveStep(width);
            const locs = programRef.current.locations;
            const mouse = mouseRef.current;
            const dpr = dprRef.current;

            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform2f(locs.resolution, width, height);
            gl.uniform1f(locs.time, time);

            wavesConfig.forEach((wave, index) => {
                const buffer = vertexBuffersRef.current[index];
                if (!buffer) return;

                const vertexCount = fillWaveVertices(buffer, width, height, wave, time, step, mouse, dpr);
                const colors = parsedWaveColors[index];

                gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
                gl.bufferData(gl.ARRAY_BUFFER, buffer.subarray(0, vertexCount * 2), gl.DYNAMIC_DRAW);

                gl.enableVertexAttribArray(locs.position);
                gl.vertexAttribPointer(locs.position, 2, gl.FLOAT, false, 0, 0);

                gl.uniform4fv(locs.gradient, colors.gradientStart);
                gl.uniform4fv(locs.gradientEnd, colors.gradientEnd);

                if (wave.glassEffect) {
                    gl.uniform4fv(locs.tint, colors.tint);
                    gl.uniform1f(locs.refractionStrength, wave.glassEffect.refractionStrength);
                    gl.uniform1f(locs.chromaticAberration, wave.glassEffect.chromaticAberration);
                } else {
                    gl.uniform4f(locs.tint, 0, 0, 0, 0);
                    gl.uniform1f(locs.refractionStrength, 0);
                    gl.uniform1f(locs.chromaticAberration, 0);
                }

                gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
            });

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

            resizeObserver.disconnect();

            if (programRef.current && glRef.current) {
                glRef.current.deleteProgram(programRef.current.program);
                programRef.current = null;
            }

            if (bufferRef.current && glRef.current) {
                glRef.current.deleteBuffer(bufferRef.current);
                bufferRef.current = null;
            }

            glRef.current = null;
            vertexBuffersRef.current = [];
        };
    }, []);

    return <canvas ref={canvasRef} className="waves-canvas" />;
});

export default WavesBackgroundWebGL;
