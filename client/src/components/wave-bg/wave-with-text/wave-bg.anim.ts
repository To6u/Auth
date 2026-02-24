import { lerp, easeInOutCubic, pushQuad, TEXT_CONFIG, TEXT_COLORS } from './wave-bg.utils';
import type { TextLine, TextAnimState } from './wave-bg.types';

// ==================== CONSTANTS ====================

const FLOATS_PER_VERTEX = 8; // x, y, r, g, b, a, u, v
const MAX_QUADS_PER_LINE = 3;
const WAVE_SEGMENTS = 20;

export const ANIM_BUFFER_MULTIPLIER = MAX_QUADS_PER_LINE * WAVE_SEGMENTS * 6 * FLOATS_PER_VERTEX;

export const ANIM_CONFIG = {
    initialSpeed: 0.02,
    initialDoneThreshold: 0.995,
    morphSpeed: 0.015,
    timerSpeed: 0.003,
    exitSmoothing: 0.1,
    exitFadeStart: 0.2,
    scrollRange: 0.5,
    lineDelayRange: 0.15,
    staggerRange: 0.4,
    entrySpread: 800,
    exitSpread: 800,
    waveOffsetAmplitude: 5,
    gradientZone: 0.2,
    halfWidthPulse: 0.6,
    chromaticBase: 15,
    chromaticAlphaScale: 0.7,
    exitOffsetY: 0.6,
    // Параметры волны текстовых линий
    waveAmplitudeBase: 18,
    waveAmplitudeStep: 0, // добавляется per (index % 3)
    waveFrequencyBase: 0.01,
    waveFrequencyStep: 0, // добавляется per (index % 5)
    wavePhaseStep: 50, // сдвиг фазы между строками
} as const;

type RGBA = [number, number, number, number];

// ==================== PRE-ALLOCATED BUFFERS ====================

const colorBuf: RGBA = [0, 0, 0, 1];

const layer0Color: RGBA = [0, 0, 0, 0];
const layer1Color: RGBA = [0, 0, 0, 0];
const layer2Color: RGBA = [0, 0, 0, 0];

const layers: [number, RGBA][] = [
    [0, layer0Color],
    [0, layer1Color],
    [0, layer2Color],
];

// ==================== STATE ====================

export const createTextAnimState = (): TextAnimState => ({
    initialized: false,
    initialProgress: 0,
    initialDone: false,
    morphProgress: 0,
    morphTarget: 0,
    lastMorphTime: 0,
    timerProgress: 0,
    exitProgress: 0,
    scrollY: 0,
    waveScrollProgress: 0,
});

export const updateTextAnimState = (anim: TextAnimState, time: number): void => {
    if (!anim.initialized) return;

    if (!anim.initialDone) {
        anim.initialProgress = Math.min(1, anim.initialProgress + ANIM_CONFIG.initialSpeed);
        if (anim.initialProgress >= ANIM_CONFIG.initialDoneThreshold) anim.initialDone = true;
        return;
    }

    if (time - anim.lastMorphTime > TEXT_CONFIG.morphDuration) {
        anim.morphTarget = anim.morphTarget === 0 ? 1 : 0;
        anim.lastMorphTime = time;
        anim.timerProgress = 0;
    }

    if (anim.morphTarget === 1) {
        anim.morphProgress = Math.min(1, anim.morphProgress + ANIM_CONFIG.morphSpeed);
    } else {
        anim.morphProgress = Math.max(0, anim.morphProgress - ANIM_CONFIG.morphSpeed);
    }

    anim.timerProgress = Math.min(1, anim.timerProgress + ANIM_CONFIG.timerSpeed);
};

// ==================== RENDERING ====================

const fillWavyLine = (
    buf: Float32Array,
    idx: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    halfWidth: number,
    color: RGBA,
    time: number,
    amplitude: number = ANIM_CONFIG.waveAmplitudeBase,
    frequency: number = ANIM_CONFIG.waveFrequencyBase,
    segments: number = WAVE_SEGMENTS
): number => {
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;

    for (let i = 0; i < segments; i++) {
        const sx1 = x1 + dx * i;
        const sx2 = x1 + dx * (i + 1);
        const sy1 = y1 + dy * i + Math.sin(sx1 * frequency + time * 0.001) * amplitude;
        const sy2 = y1 + dy * (i + 1) + Math.sin(sx2 * frequency + time * 0.001) * amplitude;
        const u1 = i / segments;
        const u2 = (i + 1) / segments;
        // Толщина по sin(u * PI) — максимум в середине, 0 на концах
        const taper = Math.max(0.3, (Math.sin(u1 * Math.PI) + Math.sin(u2 * Math.PI)) / 2);
        idx = pushQuad(buf, idx, sx1, sy1, sx2, sy2, halfWidth * taper, color, u1, u2);
    }

    return idx;
};

export const fillLineBuffer = (
    lineDataBuf: Float32Array,
    lines: TextLine[],
    anim: TextAnimState,
    width: number,
    height: number,
    dpr: number,
    time: number = 0
): number => {
    if (lines.length === 0 || !anim.initialized) return 0;

    const scale = (width / TEXT_CONFIG.canvasWidth) * TEXT_CONFIG.scale;
    const offsetX = (width - TEXT_CONFIG.canvasWidth * scale) / 2;
    const baseOffsetY = height * TEXT_CONFIG.verticalPosition - (TEXT_CONFIG.canvasHeight * scale) / 2;

    const viewportHeight = height / dpr;
    const scrollProgress = Math.max(0, Math.min(1, anim.scrollY / (viewportHeight * ANIM_CONFIG.scrollRange)));
    anim.exitProgress = lerp(anim.exitProgress, scrollProgress, ANIM_CONFIG.exitSmoothing);

    const offsetY = baseOffsetY - anim.exitProgress * height * ANIM_CONFIG.exitOffsetY;
    const lineHalfWidth = (TEXT_CONFIG.lineWidth * scale) / 2;
    const adjustedExit = Math.max(0, (anim.exitProgress - ANIM_CONFIG.exitFadeStart) / (1 - ANIM_CONFIG.exitFadeStart));

    let idx = 0;

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const lineDelay = (index / lines.length) * ANIM_CONFIG.lineDelayRange;
        const adjustedProgress = Math.max(0, Math.min(1, (anim.morphProgress - lineDelay) / (1 - lineDelay)));
        const eased = easeInOutCubic(adjustedProgress);

        let x1: number, y1: number, x2: number, y2: number;

        if (!anim.initialDone) {
            const direction = index % 2 === 0 ? 1 : -1;
            const progress = easeInOutCubic(anim.initialProgress);
            x1 = line.velopX1 - direction * ANIM_CONFIG.entrySpread * (1 - progress);
            x2 = line.velopX2 - direction * ANIM_CONFIG.entrySpread * (1 - progress);
            y1 = line.velopY1;
            y2 = line.velopY2;
        } else {
            x1 = line.velopX1 + (line.signX1 - line.velopX1) * eased;
            y1 = line.velopY1 + (line.signY1 - line.velopY1) * eased;
            x2 = line.velopX2 + (line.signX2 - line.velopX2) * eased;
            y2 = line.velopY2 + (line.signY2 - line.velopY2) * eased;

            const waveOffset =
                Math.sin(adjustedProgress * Math.PI) * ANIM_CONFIG.waveOffsetAmplitude * (index % 2 === 0 ? 1 : -1);
            y1 += waveOffset;
            y2 += waveOffset;
        }

        x1 = x1 * scale + offsetX;
        x2 = x2 * scale + offsetX;
        y1 = y1 * scale + offsetY;
        y2 = y2 * scale + offsetY;

        if (anim.exitProgress > 0.01) {
            const spreadDir = index % 2 === 0 ? -1 : 1;
            const spreadEasing = anim.exitProgress * anim.exitProgress;
            const spreadX = spreadDir * anim.exitProgress * ANIM_CONFIG.exitSpread * scale * (1 + spreadEasing);
            x1 += spreadX;
            x2 += spreadX;
        }

        const normalizedY = (y1 - offsetY) / (TEXT_CONFIG.canvasHeight * scale);
        const isSign = anim.morphProgress >= 0.5;
        const effectiveY = isSign ? 1 - normalizedY : normalizedY;
        const tp = anim.timerProgress;

        let color: RGBA;
        if (effectiveY <= tp - ANIM_CONFIG.gradientZone) {
            color = TEXT_COLORS.fill;
        } else if (effectiveY <= tp + ANIM_CONFIG.gradientZone) {
            const t = Math.max(
                0,
                Math.min(1, (tp + ANIM_CONFIG.gradientZone - effectiveY) / (ANIM_CONFIG.gradientZone * 2))
            );
            colorBuf[0] = TEXT_COLORS.base[0] + (TEXT_COLORS.fill[0] - TEXT_COLORS.base[0]) * t;
            colorBuf[1] = TEXT_COLORS.base[1] + (TEXT_COLORS.fill[1] - TEXT_COLORS.base[1]) * t;
            colorBuf[2] = TEXT_COLORS.base[2] + (TEXT_COLORS.fill[2] - TEXT_COLORS.base[2]) * t;
            colorBuf[3] = 1.0;
            color = colorBuf;
        } else {
            color = TEXT_COLORS.base;
        }

        const dynamicHalfWidth =
            lineHalfWidth * (1 + Math.sin(adjustedProgress * Math.PI) * ANIM_CONFIG.halfWidthPulse);

        const waveAmplitude = ANIM_CONFIG.waveAmplitudeBase + (index % 3) * ANIM_CONFIG.waveAmplitudeStep;
        const waveFrequency = ANIM_CONFIG.waveFrequencyBase + (index % 5) * ANIM_CONFIG.waveFrequencyStep;
        const wavePhase = time;

        if (adjustedExit < 0.01) {
            idx = fillWavyLine(
                lineDataBuf,
                idx,
                x1,
                y1,
                x2,
                y2,
                dynamicHalfWidth,
                color,
                wavePhase,
                waveAmplitude,
                waveFrequency
            );
            continue;
        }

        const staggerDelay = (index / lines.length) * ANIM_CONFIG.staggerRange;
        const lineFade = Math.max(0, Math.min(1, 1 - (adjustedExit - staggerDelay) / (1 - staggerDelay)));

        if (lineFade < 0.01) continue;

        const midX = (x1 + x2) / 2;
        const halfLength = ((x2 - x1) / 2) * (0.3 + lineFade * 0.7);
        const sx1 = midX - halfLength;
        const sx2 = midX + halfLength;
        const fadedHalfWidth = dynamicHalfWidth * lineFade;
        const chromaticAmount = (1 - lineFade) * ANIM_CONFIG.chromaticBase * scale;
        const spreadDir = index % 2 === 0 ? 1 : -1;
        const chromaticAlpha = (1 - lineFade) * ANIM_CONFIG.chromaticAlphaScale;

        layers[0][0] = -chromaticAmount * spreadDir;
        layer0Color[0] = color[0];
        layer0Color[1] = 0;
        layer0Color[2] = 0;
        layer0Color[3] = color[3] * chromaticAlpha;

        layers[1][0] = 0;
        layer1Color[0] = color[0];
        layer1Color[1] = color[1];
        layer1Color[2] = color[2];
        layer1Color[3] = color[3] * lineFade;

        layers[2][0] = chromaticAmount * spreadDir;
        layer2Color[0] = 0;
        layer2Color[1] = 0;
        layer2Color[2] = color[2];
        layer2Color[3] = color[3] * chromaticAlpha;

        for (let l = 0; l < 3; l++) {
            const [offset, layerColor] = layers[l];
            idx = fillWavyLine(
                lineDataBuf,
                idx,
                sx1 + offset,
                y1,
                sx2 + offset,
                y2,
                fadedHalfWidth,
                layerColor,
                wavePhase,
                waveAmplitude,
                waveFrequency
            );
        }
    }

    return idx;
};
