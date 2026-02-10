export interface WaveConfig {
    amplitude: number;
    frequency: number;
    phase: number;
    speed: number;
    verticalSpeed: number;
    gradientColors: [string, string];
    lineWidth: number;
    blur?: number; // blur радиус в пикселях (опционально)
}

// Настройка общей скорости анимации (от 1 до 10)
// 1 = супермедленно, 10 = текущая скорость
export const WAVE_SPEED_MULTIPLIER = 2; // Измените это значение от 1 до 10

export const wavesConfig: WaveConfig[] = [
    // Первая партия - 4 волны (самые дальние, тёмные, тонкие, прозрачные)
    {
        amplitude: 100,
        frequency: 0.005,
        phase: 0,
        speed: 0.00375,
        verticalSpeed: 0.3,
        gradientColors: ['rgba(16, 46, 74, 0.2)', 'rgba(88, 135, 255, 0.15)'],
        lineWidth: 80,
        blur: 8,
    },
    {
        amplitude: 120,
        frequency: 0.004,
        phase: (Math.PI / 1.5) * 2,
        speed: 0.003,
        verticalSpeed: 0.2,
        gradientColors: ['rgba(88, 135, 255, 0.25)', 'rgba(85, 193, 255, 0.2)'],
        lineWidth: 100,
        blur: 7,
    },
    {
        amplitude: 85,
        frequency: 0.0065,
        phase: Math.PI * 1.6 * 2,
        speed: 0.005,
        verticalSpeed: 0.38,
        gradientColors: ['rgba(113, 90, 255, 0.3)', 'rgba(16, 46, 74, 0.25)'],
        lineWidth: 90,
        blur: 6,
    },
    {
        amplitude: 105,
        frequency: 0.0058,
        phase: Math.PI * 1.9 * 2,
        speed: 0.00475,
        verticalSpeed: 0.42,
        gradientColors: ['rgba(85, 193, 255, 0.3)', 'rgba(88, 135, 255, 0.25)'],
        lineWidth: 110,
        blur: 5,
    },
];
