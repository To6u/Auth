export interface WaveConfig {
    amplitude: number;
    frequency: number;
    phase: number;
    speed: number;
    verticalSpeed: number;
    gradientColors: [string, string];
    lineWidth: number;
    widthModulation?: {
        frequency: number;
        amplitude: number;
        speed: number;
    };
    tilt?: {
        frequency: number;
        amplitude: number;
        speed: number;
    };
    glassEffect?: {
        refractionStrength: number;
        chromaticAberration: number;
        tint: string;
    };
}

// Предпарсенные RGBA значения для GPU [r, g, b, a] в диапазоне 0-1
export interface ParsedWaveColors {
    gradientStart: [number, number, number, number];
    gradientEnd: [number, number, number, number];
    tint: [number, number, number, number];
}

export const WAVE_SPEED_MULTIPLIER = 0.5;
export const WAVE_WIDTH_MULTIPLIER = 1;

// Парсинг rgba строки в нормализованный массив
const parseRGBA = (rgba: string): [number, number, number, number] => {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return [0, 0, 0, 0];
    return [parseInt(match[1]) / 255, parseInt(match[2]) / 255, parseInt(match[3]) / 255, parseFloat(match[4] ?? '1')];
};

export const wavesConfig: WaveConfig[] = [
    // Дальняя волна (тонкая, прозрачная)
    {
        amplitude: 180,
        frequency: 0.003,
        phase: 0,
        speed: 0.003,
        verticalSpeed: 50, // Исправлено: теперь даёт заметное вертикальное движение
        gradientColors: ['rgba(255,9,206,0.9)', 'rgba(0,162,255,0.9)'],
        lineWidth: 440,
        widthModulation: {
            frequency: 0.002,
            amplitude: 0.4,
            speed: 0.001,
        },
        tilt: {
            frequency: 0.001,
            amplitude: 0.15,
            speed: 0.0005,
        },
        glassEffect: {
            refractionStrength: 8,
            chromaticAberration: 0.3,
            tint: 'rgba(88, 135, 255, 0.1)',
        },
    },

    // Средняя волна
    {
        amplitude: 100,
        frequency: 0.004,
        phase: Math.PI * 0.5,
        speed: 0.002,
        verticalSpeed: 60,
        gradientColors: ['rgba(14,69,248,0.9)', 'rgba(255,165,2,0.9)'],
        lineWidth: 560,
        widthModulation: {
            frequency: 0.0015,
            amplitude: 0.5,
            speed: 0.0008,
        },
        tilt: {
            frequency: 0.0008,
            amplitude: 0.2,
            speed: 0.0006,
        },
        glassEffect: {
            refractionStrength: 12,
            chromaticAberration: 0.4,
            tint: 'rgba(113, 90, 255, 0.15)',
        },
    },

    // Ближняя волна (толстая, яркая)
    {
        amplitude: 120,
        frequency: 0.005,
        phase: Math.PI,
        speed: 0.002,
        verticalSpeed: 80,
        gradientColors: ['rgba(17,255,112,0.9)', 'rgba(140,24,248,0.9)'],
        lineWidth: 580,
        widthModulation: {
            frequency: 0.003,
            amplitude: 0.6,
            speed: 0.0012,
        },
        tilt: {
            frequency: 0.0012,
            amplitude: 0.25,
            speed: 0.0007,
        },
        glassEffect: {
            refractionStrength: 15,
            chromaticAberration: 0.5,
            tint: 'rgba(166, 130, 255, 0.2)',
        },
    },
];

// Предпарсенные цвета — вычисляются один раз при загрузке модуля
export const parsedWaveColors: ParsedWaveColors[] = wavesConfig.map((wave) => ({
    gradientStart: parseRGBA(wave.gradientColors[0]),
    gradientEnd: parseRGBA(wave.gradientColors[1]),
    tint: wave.glassEffect ? parseRGBA(wave.glassEffect.tint) : [0, 0, 0, 0],
}));
