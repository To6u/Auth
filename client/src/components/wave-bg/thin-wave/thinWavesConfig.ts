export interface ThinWaveConfig {
    amplitude: number;
    frequency: number;
    phase: number;
    speed: number;
    verticalSpeed: number;
    gradientColors: [string, string];
    lineWidth: number;
}

// Настройка общей скорости анимации (от 1 до 10)
export const THIN_WAVE_SPEED_MULTIPLIER = 2;

export const thinWavesConfig: ThinWaveConfig[] = [
    // Белые/светлые полупрозрачные волны для контраста

    // Первая партия - 4 волны
    {
        amplitude: 110,
        frequency: 0.0052,
        phase: 0.5,
        speed: 0.0038,
        verticalSpeed: 0.35,
        gradientColors: ['rgba(255, 244, 234, 0.15)', 'rgba(240, 240, 255, 0.1)'],
        lineWidth: 4,
    },
    {
        amplitude: 125,
        frequency: 0.0042,
        phase: Math.PI / 1.3,
        speed: 0.0032,
        verticalSpeed: 0.22,
        gradientColors: ['rgba(255, 244, 234, 0.14)', 'rgba(235, 240, 255, 0.09)'],
        lineWidth: 4,
    },
    {
        amplitude: 88,
        frequency: 0.0064,
        phase: Math.PI * 1.55,
        speed: 0.0049,
        verticalSpeed: 0.39,
        gradientColors: ['rgba(255, 244, 234, 0.12)', 'rgba(235, 245, 255, 0.07)'],
        lineWidth: 3,
    },
    {
        amplitude: 108,
        frequency: 0.0056,
        phase: Math.PI * 1.88,
        speed: 0.0045,
        verticalSpeed: 0.43,
        gradientColors: ['rgba(255, 244, 234, 0.11)', 'rgba(240, 240, 255, 0.06)'],
        lineWidth: 3,
    },

    // Вторая партия - 4 волны
    {
        amplitude: 118,
        frequency: 0.0047,
        phase: Math.PI * 2.25,
        speed: 0.004,
        verticalSpeed: 0.36,
        gradientColors: ['rgba(255, 244, 234, 0.14)', 'rgba(235, 245, 255, 0.09)'],
        lineWidth: 4,
    },
    {
        amplitude: 128,
        frequency: 0.004,
        phase: Math.PI * 3.05,
        speed: 0.0033,
        verticalSpeed: 0.26,
        gradientColors: ['rgba(255, 244, 234, 0.15)', 'rgba(235, 240, 255, 0.1)'],
        lineWidth: 4,
    },
    {
        amplitude: 91,
        frequency: 0.0066,
        phase: Math.PI * 3.85,
        speed: 0.0053,
        verticalSpeed: 0.38,
        gradientColors: ['rgba(255, 244, 234, 0.11)', 'rgba(240, 240, 255, 0.06)'],
        lineWidth: 3,
    },
    {
        amplitude: 105,
        frequency: 0.0056,
        phase: Math.PI * 4.25,
        speed: 0.0044,
        verticalSpeed: 0.41,
        gradientColors: ['rgba(255, 244, 234, 0.13)', 'rgba(245, 250, 255, 0.08)'],
        lineWidth: 3,
    },

    // Третья партия - 4 волны
    {
        amplitude: 100,
        frequency: 0.005,
        phase: Math.PI * 4.65,
        speed: 0.0037,
        verticalSpeed: 0.3,
        gradientColors: ['rgba(255, 244, 234, 0.13)', 'rgba(240, 245, 255, 0.08)'],
        lineWidth: 3,
    },
    {
        amplitude: 106,
        frequency: 0.0055,
        phase: Math.PI * 5.45,
        speed: 0.0042,
        verticalSpeed: 0.34,
        gradientColors: ['rgba(255, 244, 234, 0.12)', 'rgba(250, 250, 255, 0.07)'],
        lineWidth: 4,
    },
    {
        amplitude: 115,
        frequency: 0.0049,
        phase: Math.PI * 6.25,
        speed: 0.0038,
        verticalSpeed: 0.35,
        gradientColors: ['rgba(255, 244, 234, 0.13)', 'rgba(240, 245, 255, 0.08)'],
        lineWidth: 4,
    },
    {
        amplitude: 102,
        frequency: 0.0062,
        phase: Math.PI * 6.65,
        speed: 0.0049,
        verticalSpeed: 0.43,
        gradientColors: ['rgba(255, 244, 234, 0.11)', 'rgba(235, 250, 255, 0.07)'],
        lineWidth: 3,
    },
];
