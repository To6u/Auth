import { useEffect, useRef, useCallback, memo } from 'react';
import { wavesConfig, parsedWaveColors, WAVE_SPEED_MULTIPLIER, WAVE_WIDTH_MULTIPLIER } from './wavesConfigWebGL';
import type { WaveConfig } from './wavesConfigWebGL';
import './waves-canvas.css';

// ==================== TYPES ====================

interface ShaderProgram {
    program: WebGLProgram;
    locations: Record<string, number | WebGLUniformLocation | null>;
}

interface TrailPoint {
    x: number;
    y: number;
    age: number;
}

interface MouseState {
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    smoothX: number;
    smoothY: number;
    velocityX: number;
    velocityY: number;
    speed: number;
    active: boolean;
    smoothActive: number;
    trail: TrailPoint[];
}

interface TextLine {
    velopX1: number;
    velopY1: number;
    velopX2: number;
    velopY2: number;
    signX1: number;
    signY1: number;
    signX2: number;
    signY2: number;
}

// ==================== CONSTANTS ====================

const MOUSE = {
    radius: 180,
    smoothing: 0.15,
    fadeSpeed: 0.04,
    vortexStrength: 0.08,
    vortexFalloff: 2,
    repelStrength: 20,
    repelFalloff: 0.5,
    velocityMult: 5.5,
    maxSpeed: 50,
    turbulence: 0.9,
    trailLength: 122,
    trailFade: 0.08,
    trailInfluence: 0.6,
};

const PARTICLE = { stepX: 8.5, stepY: 8.5, baseSize: 5, sizeVar: 0.2, sizeMod: 0.2 };

const TEXT = {
    width: 2400,
    height: 440,
    spacing: 15,
    fontSize: 540,
    morphDuration: 5000,
    lineWidth: 4,
    vertPos: 0.5,
    baseColor: [0.898, 1, 0.671, 1] as const,
    fillColor: [0.42, 0.624, 1, 1] as const,
};

const SCROLL = {
    threshold: 0.5, // viewport heights для полного эффекта
    smoothing: 0.08, // плавность перехода
    targetLineWidth: 50, // конечная ширина линий
    maxVerticalShift: 0.5, // максимальный сдвиг вверх (% от высоты)
    mouseDisableThreshold: 0.1, // порог отключения мыши
};

// ==================== SHADERS ====================

const PARTICLE_VS = `
precision mediump float;
attribute vec2 a_pos;
attribute float a_size;
attribute vec4 a_color;
uniform vec2 u_res;
varying vec4 v_color;
void main(){
  gl_Position=vec4((a_pos/u_res)*2.0-1.0,0,1);
  gl_Position.y*=-1.0;
  gl_PointSize=a_size;
  v_color=a_color;
}`;

const PARTICLE_FS = `
precision mediump float;
varying vec4 v_color;
void main(){
  vec2 c=gl_PointCoord-0.5;
  float d=length(c)*2.0;
  if(d>1.0)discard;
  float l=1.0-d*0.5;
  float h=smoothstep(0.4,0.0,length(c-vec2(-0.2)))*0.4;
  gl_FragColor=vec4(v_color.rgb*l+h,v_color.a*(1.0-smoothstep(0.75,1.0,d)));
}`;

const LINE_VS = `
precision mediump float;
attribute vec2 a_pos;
attribute vec4 a_color;
uniform vec2 u_res;
varying vec4 v_color;
void main(){
  gl_Position=vec4((a_pos/u_res)*2.0-1.0,0,1);
  gl_Position.y*=-1.0;
  v_color=a_color;
}`;

const LINE_FS = `
precision mediump float;
varying vec4 v_color;
void main(){gl_FragColor=v_color;}`;

// ==================== UTILS ====================

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const hash = (x: number, y: number) => {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
};
const noise2D = (x: number, y: number, t: number) =>
    (Math.sin(x * 0.01 + t * 0.001) * Math.cos(y * 0.01 - t * 0.0015) +
        Math.sin(x * 0.02 - t * 0.002) * Math.sin(y * 0.015 + t * 0.001)) *
    0.5;

const lerpColor = (c1: readonly number[], c2: readonly number[], t: number): number[] => [
    c1[0] + (c2[0] - c1[0]) * t,
    c1[1] + (c2[1] - c1[1]) * t,
    c1[2] + (c2[2] - c1[2]) * t,
    c1[3] + (c2[3] - c1[3]) * t,
];

const writeQuad = (
    buf: Float32Array,
    idx: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    hw: number,
    c: number[]
): number => {
    const verts = [
        [x1, y1 - hw],
        [x2, y2 - hw],
        [x1, y1 + hw],
        [x1, y1 + hw],
        [x2, y2 - hw],
        [x2, y2 + hw],
    ];
    for (const [vx, vy] of verts) {
        buf[idx++] = vx;
        buf[idx++] = vy;
        buf[idx++] = c[0];
        buf[idx++] = c[1];
        buf[idx++] = c[2];
        buf[idx++] = c[3];
    }
    return idx;
};

// ==================== SHADER COMPILATION ====================

const createProgram = (
    gl: WebGLRenderingContext,
    vs: string,
    fs: string,
    attribs: string[],
    uniforms: string[]
): ShaderProgram | null => {
    const compile = (src: string, type: number) => {
        const s = gl.createShader(type);
        if (!s) return null;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(s));
            gl.deleteShader(s);
            return null;
        }
        return s;
    };

    const vsh = compile(vs, gl.VERTEX_SHADER);
    const fsh = compile(fs, gl.FRAGMENT_SHADER);
    if (!vsh || !fsh) return null;

    const prog = gl.createProgram();
    if (!prog) return null;

    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    gl.deleteShader(vsh);
    gl.deleteShader(fsh);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(prog));
        gl.deleteProgram(prog);
        return null;
    }

    const locs: Record<string, number | WebGLUniformLocation | null> = {};
    for (const a of attribs) locs[a] = gl.getAttribLocation(prog, a);
    for (const u of uniforms) locs[u] = gl.getUniformLocation(prog, u);

    return { program: prog, locations: locs };
};

// ==================== TEXT GENERATION ====================

const generateTextLines = async (): Promise<TextLine[]> => {
    if (document.fonts) {
        try {
            await document.fonts.load(`italic 900 ${TEXT.fontSize}px Inter`);
        } catch {
            await new Promise((r) => setTimeout(r, 100));
        }
    }

    const createCanvas = (text: string, x: number) => {
        const cv = document.createElement('canvas');
        cv.width = TEXT.width + 400;
        cv.height = TEXT.height + 100;
        const ctx = cv.getContext('2d', { willReadFrequently: true })!;
        ctx.font = `italic 900 ${TEXT.fontSize}px Inter, sans-serif`;
        ctx.fillStyle = '#FFF';
        ctx.textBaseline = 'middle';
        ctx.letterSpacing = '-40px';
        ctx.fillText(text, x, 250);
        return ctx.getImageData(0, 0, cv.width, cv.height);
    };

    const extractLines = (data: ImageData) => {
        const lines: { y: number; x1: number; x2: number }[] = [];
        for (let y = 0; y < data.height; y += TEXT.spacing) {
            let start = -1;
            for (let x = 300; x < 2500; x++) {
                const alpha = data.data[(y * data.width + x) * 4 + 3];
                if (alpha > 128) {
                    if (start === -1) start = x;
                } else if (start !== -1) {
                    lines.push({ y, x1: start, x2: x - 1 });
                    start = -1;
                }
            }
            if (start !== -1) lines.push({ y, x1: start, x2: 2499 });
        }
        return lines;
    };

    const velopLines = extractLines(createCanvas('VELOP', 360));
    const signLines = extractLines(createCanvas('SIGN', 580));
    const max = Math.max(velopLines.length, signLines.length);

    return Array.from({ length: max }, (_, i) => {
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

// ==================== WAVE FUNCTIONS ====================

const calcWaveY = (x: number, w: WaveConfig, t: number, h: number): number => {
    const phase = w.phase + t * w.speed * WAVE_SPEED_MULTIPLIER;
    let y = h * 0.5 + w.verticalSpeed * Math.sin(t * 0.001) + Math.sin(x * w.frequency + phase) * w.amplitude;
    if (w.tilt) {
        y += Math.sin(x * w.tilt.frequency + t * w.tilt.speed * WAVE_SPEED_MULTIPLIER) * w.tilt.amplitude * h;
    }
    return y;
};

const calcWaveWidth = (x: number, w: WaveConfig, t: number): number => {
    const base = w.lineWidth * WAVE_WIDTH_MULTIPLIER;
    if (!w.widthModulation) return base;
    const mod = Math.sin(x * w.widthModulation.frequency + t * w.widthModulation.speed * WAVE_SPEED_MULTIPLIER);
    return base * (1 + mod * w.widthModulation.amplitude);
};

const fillParticles = (
    buf: Float32Array,
    w: number,
    h: number,
    wave: WaveConfig,
    waveIdx: number,
    time: number,
    mouse: MouseState,
    dpr: number,
    scrollProgress: number
): number => {
    const colors = parsedWaveColors[waveIdx];
    const stepX = PARTICLE.stepX * dpr;
    const stepY = PARTICLE.stepY * dpr;
    const baseSize = PARTICLE.baseSize * dpr;
    const mouseX = mouse.smoothX * dpr;
    const mouseY = mouse.smoothY * dpr;
    const radius = MOUSE.radius * dpr;
    const radiusSq = radius * radius;
    const normSpeed = Math.min(mouse.speed / MOUSE.maxSpeed, 1);
    const velMag = Math.sqrt(mouse.velocityX ** 2 + mouse.velocityY ** 2);
    const velDirX = velMag > 0.1 ? mouse.velocityX / velMag : 0;
    const velDirY = velMag > 0.1 ? mouse.velocityY / velMag : 0;
    const vortexDir = waveIdx % 2 === 0 ? 1 : -1;

    // Scroll-based adjustments
    const easedScroll = easeOutCubic(scrollProgress);
    const targetWidth = SCROLL.targetLineWidth * WAVE_WIDTH_MULTIPLIER * dpr;
    const verticalOffset = easedScroll * h * SCROLL.maxVerticalShift;

    let idx = 0;

    for (let x = 0; x <= w; x += stepX) {
        const baseCenterY = calcWaveY(x, wave, time, h);
        const baseHalfW = calcWaveWidth(x, wave, time) / 2;

        // Apply scroll interpolation
        const centerY = baseCenterY - verticalOffset;
        const targetHalfW = targetWidth / 2;
        const halfW = lerp(baseHalfW, targetHalfW, easedScroll);

        const gradPos = x / w;
        const baseColor = lerpColor(colors.gradientStart, colors.gradientEnd, gradPos);

        let sizeMod = 1;
        if (wave.widthModulation) {
            const phase = time * wave.widthModulation.speed * WAVE_SPEED_MULTIPLIER;
            sizeMod = 1 + Math.sin(x * wave.widthModulation.frequency + phase) * PARTICLE.sizeMod;
        }

        for (let offY = -halfW; offY <= halfW; offY += stepY) {
            let fx = x;
            let fy = centerY + offY;
            let forceX = 0;
            let forceY = 0;

            if (mouse.smoothActive > 0.01) {
                const dx = fx - mouseX;
                const dy = fy - mouseY;
                const distSq = dx * dx + dy * dy;

                if (distSq < radiusSq && distSq > 0) {
                    const dist = Math.sqrt(distSq);
                    const normDist = dist / radius;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const perpX = -ny * vortexDir;
                    const perpY = nx * vortexDir;

                    // Vortex
                    const vortexF = Math.pow(1 - normDist, MOUSE.vortexFalloff);
                    const vortex =
                        MOUSE.vortexStrength *
                        vortexF *
                        radius *
                        mouse.smoothActive *
                        (1 + normSpeed * MOUSE.velocityMult);
                    forceX += perpX * vortex;
                    forceY += perpY * vortex;

                    // Repel
                    const repelF = Math.pow(1 - normDist, MOUSE.repelFalloff);
                    const repel = MOUSE.repelStrength * dpr * repelF * mouse.smoothActive;
                    forceX += nx * repel;
                    forceY += ny * repel;

                    // Turbulence
                    if (normSpeed > 0.2) {
                        const turb = noise2D(fx, fy, time) * MOUSE.turbulence * normSpeed * radius * 0.3;
                        forceX += -velDirY * turb;
                        forceY += velDirX * turb;
                    }

                    // Drag
                    const drag = normSpeed * repelF * radius * 0.15 * mouse.smoothActive;
                    forceX += velDirX * drag;
                    forceY += velDirY * drag;
                }

                // Trail
                for (const pt of mouse.trail) {
                    const tr = radius * (1 - pt.age * 0.6);
                    const trSq = tr * tr;
                    const tdx = fx - pt.x * dpr;
                    const tdy = fy - pt.y * dpr;
                    const tdSq = tdx * tdx + tdy * tdy;

                    if (tdSq < trSq && tdSq > 0) {
                        const td = Math.sqrt(tdSq);
                        const tn = td / tr;
                        const tnx = tdx / td;
                        const tny = tdy / td;
                        const age = (1 - pt.age) * MOUSE.trailInfluence;
                        const fall = (1 - tn) ** 2;

                        forceX += -tny * vortexDir * age * fall * radius * 0.2 * mouse.smoothActive;
                        forceY += tnx * vortexDir * age * fall * radius * 0.2 * mouse.smoothActive;
                        forceX += tnx * age * fall * dpr * 15 * mouse.smoothActive;
                        forceY += tny * age * fall * dpr * 15 * mouse.smoothActive;
                    }
                }
            }

            const noiseFactor = 0.8 + hash(x, offY) * 0.4;
            fx += forceX * noiseFactor;
            fy += forceY * noiseFactor;

            const sizeNoise = hash(x, offY) * 2 - 1;
            const size = baseSize * sizeMod * (1 + sizeNoise * PARTICLE.sizeVar);
            const edgeFade = 1 - Math.abs(offY / halfW) * 0.4;
            const bright = 0.9 + hash(x + 1000, offY) * 0.2;

            buf[idx++] = fx;
            buf[idx++] = fy;
            buf[idx++] = size;
            buf[idx++] = baseColor[0] * bright;
            buf[idx++] = baseColor[1] * bright;
            buf[idx++] = baseColor[2] * bright;
            buf[idx++] = baseColor[3] * edgeFade;
        }
    }

    return idx / 7;
};

// ==================== MOUSE UPDATE ====================

const updateMouse = (m: MouseState): void => {
    m.smoothX = lerp(m.smoothX, m.x, MOUSE.smoothing);
    m.smoothY = lerp(m.smoothY, m.y, MOUSE.smoothing);
    m.velocityX = lerp(m.velocityX, m.x - m.prevX, 0.3);
    m.velocityY = lerp(m.velocityY, m.y - m.prevY, 0.3);
    m.speed = Math.sqrt(m.velocityX ** 2 + m.velocityY ** 2);
    m.prevX = m.x;
    m.prevY = m.y;
    m.smoothActive = lerp(m.smoothActive, m.active ? 1 : 0, MOUSE.fadeSpeed);

    if (m.active && m.speed > 1) {
        const last = m.trail[0];
        if (!last || (m.x - last.x) ** 2 + (m.y - last.y) ** 2 > 100) {
            m.trail.unshift({ x: m.x, y: m.y, age: 0 });
            if (m.trail.length > MOUSE.trailLength) m.trail.pop();
        }
    }

    for (let i = m.trail.length - 1; i >= 0; i--) {
        m.trail[i].age += MOUSE.trailFade;
        if (m.trail[i].age >= 1) m.trail.splice(i, 1);
    }
};

// ==================== MAIN COMPONENT ====================

const WavesWithTextDotted = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const particleProgRef = useRef<ShaderProgram | null>(null);
    const lineProgRef = useRef<ShaderProgram | null>(null);
    const particleBufRef = useRef<WebGLBuffer | null>(null);
    const lineBufRef = useRef<WebGLBuffer | null>(null);
    const rafRef = useRef(0);
    const vertBufsRef = useRef<Float32Array[]>([]);
    const textLinesRef = useRef<TextLine[]>([]);
    const lineBufDataRef = useRef<Float32Array | null>(null);
    const unmountedRef = useRef(false);
    const dprRef = useRef(1);
    const mouseRef = useRef<MouseState>({
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0,
        smoothX: 0,
        smoothY: 0,
        velocityX: 0,
        velocityY: 0,
        speed: 0,
        active: false,
        smoothActive: 0,
        trail: [],
    });
    const animRef = useRef({
        init: false,
        initProg: 0,
        initDone: false,
        morphProg: 0,
        morphTarget: 0,
        lastMorph: 0,
        timerProg: 0,
        exitProg: 0,
        scrollY: 0,
        smoothScrollProgress: 0,
    });

    const renderParticles = useCallback(
        (
            gl: WebGLRenderingContext,
            prog: ShaderProgram,
            buf: WebGLBuffer,
            verts: Float32Array,
            count: number,
            time: number,
            w: number,
            h: number
        ) => {
            if (count === 0) return;
            gl.useProgram(prog.program);
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, verts.subarray(0, count * 7), gl.DYNAMIC_DRAW);

            gl.enableVertexAttribArray(prog.locations.a_pos as number);
            gl.vertexAttribPointer(prog.locations.a_pos as number, 2, gl.FLOAT, false, 28, 0);
            gl.enableVertexAttribArray(prog.locations.a_size as number);
            gl.vertexAttribPointer(prog.locations.a_size as number, 1, gl.FLOAT, false, 28, 8);
            gl.enableVertexAttribArray(prog.locations.a_color as number);
            gl.vertexAttribPointer(prog.locations.a_color as number, 4, gl.FLOAT, false, 28, 12);

            gl.uniform2f(prog.locations.u_res as WebGLUniformLocation, w, h);
            gl.drawArrays(gl.POINTS, 0, count);
        },
        []
    );

    const renderTextLines = useCallback(
        (gl: WebGLRenderingContext, prog: ShaderProgram, buf: WebGLBuffer, w: number, h: number, time: number) => {
            const lines = textLinesRef.current;
            const a = animRef.current;
            if (!lines.length || !a.init) return;

            // Animation updates
            if (!a.initDone) {
                a.initProg = Math.min(1, a.initProg + 0.02);
                if (a.initProg >= 0.995) a.initDone = true;
            } else {
                if (time - a.lastMorph > TEXT.morphDuration) {
                    a.morphTarget = 1 - a.morphTarget;
                    a.lastMorph = time;
                    a.timerProg = 0;
                }
                a.morphProg = lerp(a.morphProg, a.morphTarget, 0.015);
                a.timerProg = Math.min(1, a.timerProg + 0.003);
            }

            const dpr = dprRef.current;
            const scale = w / TEXT.width;
            const offX = (w - TEXT.width * scale) / 2;
            const scrollProg = Math.max(0, Math.min(1, a.scrollY / ((h / dpr) * 0.5)));
            a.exitProg = lerp(a.exitProg, scrollProg, 0.1);
            const offY = h * TEXT.vertPos - (TEXT.height * scale) / 2 - a.exitProg * h * 0.6;

            const maxFloats = lines.length * 18 * 6;
            if (!lineBufDataRef.current || lineBufDataRef.current.length < maxFloats) {
                lineBufDataRef.current = new Float32Array(maxFloats);
            }
            const data = lineBufDataRef.current;
            let idx = 0;

            const lineHW = (TEXT.lineWidth * scale) / 2;
            const fadeStart = 0.2;
            const adjExit = Math.max(0, (a.exitProg - fadeStart) / (1 - fadeStart));

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const delay = (i / lines.length) * 0.15;
                const adjProg = Math.max(0, Math.min(1, (a.morphProg - delay) / (1 - delay)));
                const eased = ease(adjProg);

                let x1: number, y1: number, x2: number, y2: number;

                if (!a.initDone) {
                    const dir = i % 2 === 0 ? 1 : -1;
                    const prog = ease(a.initProg);
                    x1 = line.velopX1 - dir * 800 * (1 - prog);
                    x2 = line.velopX2 - dir * 800 * (1 - prog);
                    y1 = line.velopY1;
                    y2 = line.velopY2;
                } else {
                    x1 = lerp(line.velopX1, line.signX1, eased);
                    y1 = lerp(line.velopY1, line.signY1, eased);
                    x2 = lerp(line.velopX2, line.signX2, eased);
                    y2 = lerp(line.velopY2, line.signY2, eased);
                    const wave = Math.sin(adjProg * Math.PI) * 5 * (i % 2 === 0 ? 1 : -1);
                    y1 += wave;
                    y2 += wave;
                }

                x1 = x1 * scale + offX;
                x2 = x2 * scale + offX;
                y1 = y1 * scale + offY;
                y2 = y2 * scale + offY;

                if (a.exitProg > 0.01) {
                    const spread = (i % 2 === 0 ? -1 : 1) * a.exitProg * 800 * scale * (1 + a.exitProg ** 2);
                    x1 += spread;
                    x2 += spread;
                }

                // Color calculation
                const normY = (y1 - offY) / (TEXT.height * scale);
                const effY = a.morphProg >= 0.5 ? 1 - normY : normY;
                const gradZone = 0.2;
                let color: number[];

                if (effY <= a.timerProg - gradZone) {
                    color = [...TEXT.fillColor];
                } else if (effY <= a.timerProg + gradZone) {
                    const t = (a.timerProg + gradZone - effY) / (gradZone * 2);
                    color = lerpColor(TEXT.baseColor, TEXT.fillColor, Math.max(0, Math.min(1, t)));
                } else {
                    color = [...TEXT.baseColor];
                }

                const morphPhase = Math.sin(adjProg * Math.PI);
                let hw = lineHW * (1 + morphPhase * 0.3);

                if (adjExit < 0.01) {
                    idx = writeQuad(data, idx, x1, y1, x2, y2, hw, color);
                    continue;
                }

                // Exit animation
                const stagger = (i / lines.length) * 0.4;
                const fade = Math.max(0, Math.min(1, 1 - (adjExit - stagger) / (1 - stagger)));
                if (fade < 0.01) continue;

                const shrink = 0.3 + fade * 0.7;
                const midX = (x1 + x2) / 2;
                const halfLen = ((x2 - x1) / 2) * shrink;
                x1 = midX - halfLen;
                x2 = midX + halfLen;
                hw *= fade;

                const chromatic = (1 - fade) * 15 * scale;
                const dir = i % 2 === 0 ? 1 : -1;
                const chromAlpha = (1 - fade) * 0.7;

                // RGB layers
                idx = writeQuad(data, idx, x1 - chromatic * dir, y1, x2 - chromatic * dir, y2, hw, [
                    color[0],
                    0,
                    0,
                    color[3] * chromAlpha,
                ]);
                idx = writeQuad(data, idx, x1, y1, x2, y2, hw, [color[0], color[1], color[2], color[3] * fade]);
                idx = writeQuad(data, idx, x1 + chromatic * dir, y1, x2 + chromatic * dir, y2, hw, [
                    0,
                    0,
                    color[2],
                    color[3] * chromAlpha,
                ]);
            }

            gl.useProgram(prog.program);
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, idx), gl.DYNAMIC_DRAW);

            gl.enableVertexAttribArray(prog.locations.a_pos as number);
            gl.vertexAttribPointer(prog.locations.a_pos as number, 2, gl.FLOAT, false, 24, 0);
            gl.enableVertexAttribArray(prog.locations.a_color as number);
            gl.vertexAttribPointer(prog.locations.a_color as number, 4, gl.FLOAT, false, 24, 8);

            gl.uniform2f(prog.locations.u_res as WebGLUniformLocation, w, h);
            gl.drawArrays(gl.TRIANGLES, 0, idx / 6);
        },
        []
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        unmountedRef.current = false;
        const gl = canvas.getContext('webgl', {
            alpha: true,
            antialias: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'low-power',
        });
        if (!gl) return;

        glRef.current = gl;

        const particleProg = createProgram(gl, PARTICLE_VS, PARTICLE_FS, ['a_pos', 'a_size', 'a_color'], ['u_res']);
        const lineProg = createProgram(gl, LINE_VS, LINE_FS, ['a_pos', 'a_color'], ['u_res']);
        if (!particleProg || !lineProg) return;

        particleProgRef.current = particleProg;
        lineProgRef.current = lineProg;
        particleBufRef.current = gl.createBuffer();
        lineBufRef.current = gl.createBuffer();

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const maxWaveW = Math.max(...wavesConfig.map((w) => w.lineWidth * 2));
        const calcBufSize = (w: number) =>
            (Math.ceil(w / PARTICLE.stepX) + 1) * (Math.ceil(maxWaveW / PARTICLE.stepY) + 1) * 7;

        const resize = () => {
            if (unmountedRef.current) return;
            const dpr = Math.min(devicePixelRatio, 2);
            dprRef.current = dpr;
            const w = innerWidth * dpr;
            const h = innerHeight * dpr;
            canvas.width = w;
            canvas.height = h;
            gl.viewport(0, 0, w, h);
            vertBufsRef.current = wavesConfig.map(() => new Float32Array(calcBufSize(w)));
        };

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(document.body);

        generateTextLines().then((lines) => {
            textLinesRef.current = lines;
            animRef.current.init = true;
            animRef.current.lastMorph = performance.now();
        });

        const onMove = (e: MouseEvent) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
            mouseRef.current.active = true;
        };
        const onLeave = () => (mouseRef.current.active = false);
        const onScroll = () => (animRef.current.scrollY = scrollY);

        addEventListener('mousemove', onMove);
        document.addEventListener('mouseleave', onLeave);
        addEventListener('scroll', onScroll, { passive: true });

        const animate = (time: number) => {
            if (
                unmountedRef.current ||
                !particleProgRef.current ||
                !lineProgRef.current ||
                !particleBufRef.current ||
                !lineBufRef.current
            )
                return;

            const { width: w, height: h } = canvas;
            const mouse = mouseRef.current;
            const dpr = dprRef.current;
            const a = animRef.current;

            // Calculate scroll progress with smoothing
            const targetScrollProgress = Math.min(a.scrollY / (innerHeight * SCROLL.threshold), 1);
            a.smoothScrollProgress = lerp(a.smoothScrollProgress, targetScrollProgress, SCROLL.smoothing);

            // Disable mouse interaction when scrolled
            if (a.smoothScrollProgress > SCROLL.mouseDisableThreshold) {
                mouse.active = false;
            }

            updateMouse(mouse);

            gl.clear(gl.COLOR_BUFFER_BIT);

            // Wave 0
            const buf0 = vertBufsRef.current[0];
            if (buf0) {
                const count = fillParticles(buf0, w, h, wavesConfig[0], 0, time, mouse, dpr, a.smoothScrollProgress);
                renderParticles(gl, particleProgRef.current!, particleBufRef.current!, buf0, count, time, w, h);
            }

            // Text
            renderTextLines(gl, lineProgRef.current!, lineBufRef.current!, w, h, time);

            // Waves 1+
            for (let i = 1; i < wavesConfig.length; i++) {
                const buf = vertBufsRef.current[i];
                if (buf) {
                    const count = fillParticles(buf, w, h, wavesConfig[i], i, time, mouse, dpr, a.smoothScrollProgress);
                    renderParticles(gl, particleProgRef.current!, particleBufRef.current!, buf, count, time, w, h);
                }
            }

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            unmountedRef.current = true;
            cancelAnimationFrame(rafRef.current);
            removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseleave', onLeave);
            removeEventListener('scroll', onScroll);
            ro.disconnect();

            if (particleProgRef.current) gl.deleteProgram(particleProgRef.current.program);
            if (lineProgRef.current) gl.deleteProgram(lineProgRef.current.program);
            if (particleBufRef.current) gl.deleteBuffer(particleBufRef.current);
            if (lineBufRef.current) gl.deleteBuffer(lineBufRef.current);

            particleProgRef.current = null;
            lineProgRef.current = null;
            particleBufRef.current = null;
            lineBufRef.current = null;
            glRef.current = null;
            vertBufsRef.current = [];
            lineBufDataRef.current = null;
        };
    }, [renderParticles, renderTextLines]);

    return <canvas ref={canvasRef} className="waves-canvas" />;
});

export default WavesWithTextDotted;
