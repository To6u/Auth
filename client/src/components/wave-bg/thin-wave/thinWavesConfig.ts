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

    // Четвёртая партия - 4 волны
    {
        amplitude: 123,
        frequency: 0.0046,
        phase: Math.PI * 7.05,
        speed: 0.0036,
        verticalSpeed: 0.32,
        gradientColors: ['rgba(255, 244, 234, 0.14)', 'rgba(240, 250, 255, 0.09)'],
        lineWidth: 4,
    },
    {
        amplitude: 94,
        frequency: 0.0063,
        phase: Math.PI * 7.85,
        speed: 0.0051,
        verticalSpeed: 0.39,
        gradientColors: ['rgba(255, 244, 234, 0.12)', 'rgba(245, 245, 255, 0.07)'],
        lineWidth: 3,
    },
    {
        amplitude: 107,
        frequency: 0.0057,
        phase: Math.PI * 8.65,
        speed: 0.0045,
        verticalSpeed: 0.41,
        gradientColors: ['rgba(255, 244, 234, 0.12)', 'rgba(240, 245, 255, 0.07)'],
        lineWidth: 3,
    },
    {
        amplitude: 99,
        frequency: 0.0065,
        phase: Math.PI * 9.05,
        speed: 0.0053,
        verticalSpeed: -0.51,
        gradientColors: ['rgba(255, 244, 234, 0.11)', 'rgba(245, 250, 255, 0.07)'],
        lineWidth: 3,
    },

    // Пятая партия - 4 волны
    {
        amplitude: 125,
        frequency: 0.0044,
        phase: Math.PI * 9.45,
        speed: 0.0034,
        verticalSpeed: 0.31,
        gradientColors: ['rgba(255, 244, 234, 0.14)', 'rgba(235, 245, 255, 0.09)'],
        lineWidth: 4,
    },
    {
        amplitude: 112,
        frequency: 0.0053,
        phase: Math.PI * 10.25,
        speed: 0.0041,
        verticalSpeed: 0.36,
        gradientColors: ['rgba(255, 244, 234, 0.13)', 'rgba(240, 245, 255, 0.08)'],
        lineWidth: 4,
    },
    {
        amplitude: 97,
        frequency: 0.0064,
        phase: Math.PI * 11.05,
        speed: 0.0052,
        verticalSpeed: 0.44,
        gradientColors: ['rgba(255, 244, 234, 0.12)', 'rgba(245, 245, 255, 0.07)'],
        lineWidth: 3,
    },
    {
        amplitude: 130,
        frequency: 0.0045,
        phase: Math.PI * 11.45,
        speed: 0.0035,
        verticalSpeed: 0.25,
        gradientColors: ['rgba(255, 244, 234, 0.15)', 'rgba(240, 250, 255, 0.1)'],
        lineWidth: 4,
    },

    // Шестая партия - 4 волны
    {
        amplitude: 119,
        frequency: 0.005,
        phase: Math.PI * 11.85,
        speed: 0.0039,
        verticalSpeed: 0.33,
        gradientColors: ['rgba(255, 244, 234, 0.14)', 'rgba(235, 240, 255, 0.09)'],
        lineWidth: 4,
    },
    {
        amplitude: 146,
        frequency: 0.0038,
        phase: Math.PI * 12.65,
        speed: 0.0029,
        verticalSpeed: 0.32,
        gradientColors: ['rgba(255, 244, 234, 0.16)', 'rgba(250, 250, 255, 0.11)'],
        lineWidth: 5,
    },
    {
        amplitude: 103,
        frequency: 0.0059,
        phase: Math.PI * 13.45,
        speed: 0.0045,
        verticalSpeed: 0.42,
        gradientColors: ['rgba(255, 244, 234, 0.12)', 'rgba(245, 245, 255, 0.07)'],
        lineWidth: 3,
    },
    {
        amplitude: 97,
        frequency: 0.0063,
        phase: Math.PI * 13.85,
        speed: 0.005,
        verticalSpeed: -0.49,
        gradientColors: ['rgba(255, 244, 234, 0.1)', 'rgba(250, 250, 255, 0.06)'],
        lineWidth: 3,
    },

    // Седьмая партия - 4 волны
    {
        amplitude: 117,
        frequency: 0.0049,
        phase: Math.PI * 14.25,
        speed: 0.0039,
        verticalSpeed: 0.34,
        gradientColors: ['rgba(255, 244, 234, 0.14)', 'rgba(240, 245, 255, 0.09)'],
        lineWidth: 4,
    },
    {
        amplitude: 126,
        frequency: 0.0042,
        phase: Math.PI * 15.05,
        speed: 0.0033,
        verticalSpeed: 0.26,
        gradientColors: ['rgba(255, 244, 234, 0.15)', 'rgba(240, 250, 255, 0.1)'],
        lineWidth: 4,
    },
    {
        amplitude: 90,
        frequency: 0.0069,
        phase: Math.PI * 15.85,
        speed: 0.0053,
        verticalSpeed: 0.41,
        gradientColors: ['rgba(255, 244, 234, 0.11)', 'rgba(240, 245, 255, 0.07)'],
        lineWidth: 3,
    },
    {
        amplitude: 105,
        frequency: 0.0057,
        phase: Math.PI * 16.25,
        speed: 0.0044,
        verticalSpeed: 0.4,
        gradientColors: ['rgba(255, 244, 234, 0.12)', 'rgba(245, 250, 255, 0.07)'],
        lineWidth: 3,
    },

    // Восьмая партия - 4 волны
    {
        amplitude: 122,
        frequency: 0.0048,
        phase: Math.PI * 16.65,
        speed: 0.0037,
        verticalSpeed: 0.35,
        gradientColors: ['rgba(255, 244, 234, 0.14)', 'rgba(235, 245, 255, 0.09)'],
        lineWidth: 4,
    },
    {
        amplitude: 123,
        frequency: 0.0043,
        phase: Math.PI * 17.45,
        speed: 0.0034,
        verticalSpeed: 0.24,
        gradientColors: ['rgba(255, 244, 234, 0.15)', 'rgba(235, 240, 255, 0.1)'],
        lineWidth: 4,
    },
    {
        amplitude: 87,
        frequency: 0.0068,
        phase: Math.PI * 18.25,
        speed: 0.0054,
        verticalSpeed: 0.38,
        gradientColors: ['rgba(255, 244, 234, 0.11)', 'rgba(235, 245, 255, 0.07)'],
        lineWidth: 3,
    },
    {
        amplitude: 106,
        frequency: 0.0056,
        phase: Math.PI * 18.65,
        speed: 0.0045,
        verticalSpeed: 0.44,
        gradientColors: ['rgba(255, 244, 234, 0.12)', 'rgba(240, 245, 255, 0.07)'],
        lineWidth: 3,
    },
];
