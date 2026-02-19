import { lerp, easeInOutCubic, pushQuad, TEXT_CONFIG, TEXT_COLORS } from './wave-bg.utils';
import type { TextLine, TextAnimState } from './wave-bg.types';

const FLOATS_PER_VERTEX = 6;
const MAX_QUADS_PER_LINE = 3;

export const ANIM_BUFFER_MULTIPLIER = MAX_QUADS_PER_LINE * 6 * FLOATS_PER_VERTEX;

type RGBA = [number, number, number, number];

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
        anim.initialProgress = Math.min(1, anim.initialProgress + 0.02);
        if (anim.initialProgress >= 0.995) anim.initialDone = true;
        return;
    }

    if (time - anim.lastMorphTime > TEXT_CONFIG.morphDuration) {
        anim.morphTarget = anim.morphTarget === 0 ? 1 : 0;
        anim.lastMorphTime = time;
        anim.timerProgress = 0;
    }

    const morphSpeed = 0.015;
    if (anim.morphTarget === 1) {
        anim.morphProgress = Math.min(1, anim.morphProgress + morphSpeed);
    } else {
        anim.morphProgress = Math.max(0, anim.morphProgress - morphSpeed);
    }

    anim.timerProgress = Math.min(1, anim.timerProgress + 0.003);
};

export const fillLineBuffer = (
    lineDataBuf: Float32Array,
    lines: TextLine[],
    anim: TextAnimState,
    width: number,
    height: number,
    dpr: number
): number => {
    if (lines.length === 0 || !anim.initialized) return 0;

    const scale = (width / TEXT_CONFIG.canvasWidth) * TEXT_CONFIG.scale;
    const offsetX = (width - TEXT_CONFIG.canvasWidth * scale) / 2;
    const baseOffsetY = height * TEXT_CONFIG.verticalPosition - (TEXT_CONFIG.canvasHeight * scale) / 2;

    const viewportHeight = height / dpr;
    const scrollProgress = Math.max(0, Math.min(1, anim.scrollY / (viewportHeight * 0.5)));
    anim.exitProgress = lerp(anim.exitProgress, scrollProgress, 0.1);

    const offsetY = baseOffsetY - anim.exitProgress * height * 0.6;
    const lineHalfWidth = (TEXT_CONFIG.lineWidth * scale) / 2;
    const fadeStart = 0.2;
    const adjustedExit = Math.max(0, (anim.exitProgress - fadeStart) / (1 - fadeStart));

    let idx = 0;

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const lineDelay = (index / lines.length) * 0.15;
        const adjustedProgress = Math.max(0, Math.min(1, (anim.morphProgress - lineDelay) / (1 - lineDelay)));
        const eased = easeInOutCubic(adjustedProgress);

        let x1: number, y1: number, x2: number, y2: number;

        if (!anim.initialDone) {
            const direction = index % 2 === 0 ? 1 : -1;
            const progress = easeInOutCubic(anim.initialProgress);
            x1 = line.velopX1 - direction * 800 * (1 - progress);
            x2 = line.velopX2 - direction * 800 * (1 - progress);
            y1 = line.velopY1;
            y2 = line.velopY2;
        } else {
            x1 = line.velopX1 + (line.signX1 - line.velopX1) * eased;
            y1 = line.velopY1 + (line.signY1 - line.velopY1) * eased;
            x2 = line.velopX2 + (line.signX2 - line.velopX2) * eased;
            y2 = line.velopY2 + (line.signY2 - line.velopY2) * eased;

            const waveOffset = Math.sin(adjustedProgress * Math.PI) * 5 * (index % 2 === 0 ? 1 : -1);
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
            const spreadX = spreadDir * anim.exitProgress * 800 * scale * (1 + spreadEasing);
            x1 += spreadX;
            x2 += spreadX;
        }

        const normalizedY = (y1 - offsetY) / (TEXT_CONFIG.canvasHeight * scale);
        const isSign = anim.morphProgress >= 0.5;
        const effectiveY = isSign ? 1 - normalizedY : normalizedY;
        const gradientZone = 0.2;
        const tp = anim.timerProgress;

        let color: RGBA;
        if (effectiveY <= tp - gradientZone) {
            color = TEXT_COLORS.fill;
        } else if (effectiveY <= tp + gradientZone) {
            const t = Math.max(0, Math.min(1, (tp + gradientZone - effectiveY) / (gradientZone * 2)));
            color = [
                TEXT_COLORS.base[0] + (TEXT_COLORS.fill[0] - TEXT_COLORS.base[0]) * t,
                TEXT_COLORS.base[1] + (TEXT_COLORS.fill[1] - TEXT_COLORS.base[1]) * t,
                TEXT_COLORS.base[2] + (TEXT_COLORS.fill[2] - TEXT_COLORS.base[2]) * t,
                1.0,
            ];
        } else {
            color = TEXT_COLORS.base;
        }

        const dynamicHalfWidth = lineHalfWidth * (1 + Math.sin(adjustedProgress * Math.PI) * 0.3);

        if (adjustedExit < 0.01) {
            idx = pushQuad(lineDataBuf, idx, x1, y1, x2, y2, dynamicHalfWidth, color);
            continue;
        }

        const staggerDelay = (index / lines.length) * 0.4;
        const lineFade = Math.max(0, Math.min(1, 1 - (adjustedExit - staggerDelay) / (1 - staggerDelay)));

        if (lineFade < 0.01) continue;

        const midX = (x1 + x2) / 2;
        const halfLength = ((x2 - x1) / 2) * (0.3 + lineFade * 0.7);
        const sx1 = midX - halfLength;
        const sx2 = midX + halfLength;
        const fadedHalfWidth = dynamicHalfWidth * lineFade;
        const chromaticAmount = (1 - lineFade) * 15 * scale;
        const spreadDir = index % 2 === 0 ? 1 : -1;
        const chromaticAlpha = (1 - lineFade) * 0.7;

        const layers: [number, RGBA][] = [
            [-chromaticAmount * spreadDir, [color[0], 0, 0, color[3] * chromaticAlpha]],
            [0, [color[0], color[1], color[2], color[3] * lineFade]],
            [chromaticAmount * spreadDir, [0, 0, color[2], color[3] * chromaticAlpha]],
        ];

        for (const [offset, layerColor] of layers) {
            idx = pushQuad(lineDataBuf, idx, sx1 + offset, y1, sx2 + offset, y2, fadedHalfWidth, layerColor);
        }
    }

    return idx;
};
