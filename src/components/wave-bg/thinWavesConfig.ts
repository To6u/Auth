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

    // Первая партия - 12 волн
    {
        amplitude: 110,
        frequency: 0.0052,
        phase: 0.5,
        speed: 0.0038,
        verticalSpeed: 0.35,
        gradientColors: ['rgba(255, 255, 255, 0.15)', 'rgba(240, 240, 255, 0.1)'],
        lineWidth: 4
    },
    {
        amplitude: 85,
        frequency: 0.0068,
        phase: Math.PI / 5,
        speed: 0.0052,
        verticalSpeed: -0.42,
        gradientColors: ['rgba(255, 255, 255, 0.12)', 'rgba(230, 240, 255, 0.08)'],
        lineWidth: 3
    },
    {
        amplitude: 145,
        frequency: 0.0031,
        phase: Math.PI / 2.8,
        speed: 0.0021,
        verticalSpeed: 0.28,
        gradientColors: ['rgba(255, 255, 255, 0.18)', 'rgba(250, 250, 255, 0.12)'],
        lineWidth: 5
    },
    {
        amplitude: 98,
        frequency: 0.0059,
        phase: Math.PI / 1.8,
        speed: 0.0043,
        verticalSpeed: -0.38,
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(240, 245, 255, 0.06)'],
        lineWidth: 3
    },
    {
        amplitude: 125,
        frequency: 0.0042,
        phase: Math.PI / 1.3,
        speed: 0.0032,
        verticalSpeed: 0.22,
        gradientColors: ['rgba(255, 255, 255, 0.14)', 'rgba(235, 240, 255, 0.09)'],
        lineWidth: 4
    },
    {
        amplitude: 73,
        frequency: 0.0077,
        phase: Math.PI * 0.9,
        speed: 0.0061,
        verticalSpeed: -0.47,
        gradientColors: ['rgba(255, 255, 255, 0.11)', 'rgba(245, 245, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 155,
        frequency: 0.0036,
        phase: Math.PI * 1.15,
        speed: 0.0027,
        verticalSpeed: 0.31,
        gradientColors: ['rgba(255, 255, 255, 0.16)', 'rgba(250, 250, 255, 0.11)'],
        lineWidth: 5
    },
    {
        amplitude: 113,
        frequency: 0.0053,
        phase: Math.PI * 1.35,
        speed: 0.0039,
        verticalSpeed: -0.34,
        gradientColors: ['rgba(255, 255, 255, 0.13)', 'rgba(240, 245, 255, 0.08)'],
        lineWidth: 4
    },
    {
        amplitude: 88,
        frequency: 0.0064,
        phase: Math.PI * 1.55,
        speed: 0.0049,
        verticalSpeed: 0.39,
        gradientColors: ['rgba(255, 255, 255, 0.12)', 'rgba(235, 245, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 133,
        frequency: 0.0041,
        phase: Math.PI * 1.75,
        speed: 0.0031,
        verticalSpeed: -0.24,
        gradientColors: ['rgba(255, 255, 255, 0.15)', 'rgba(245, 250, 255, 0.1)'],
        lineWidth: 4
    },
    {
        amplitude: 108,
        frequency: 0.0056,
        phase: Math.PI * 1.88,
        speed: 0.0045,
        verticalSpeed: 0.43,
        gradientColors: ['rgba(255, 255, 255, 0.11)', 'rgba(240, 240, 255, 0.06)'],
        lineWidth: 3
    },
    {
        amplitude: 93,
        frequency: 0.0061,
        phase: Math.PI * 2.05,
        speed: 0.0051,
        verticalSpeed: -0.51,
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(250, 250, 255, 0.06)'],
        lineWidth: 3
    },

    // Вторая партия - 12 волн
    {
        amplitude: 118,
        frequency: 0.0047,
        phase: Math.PI * 2.25,
        speed: 0.004,
        verticalSpeed: 0.36,
        gradientColors: ['rgba(255, 255, 255, 0.14)', 'rgba(235, 245, 255, 0.09)'],
        lineWidth: 4
    },
    {
        amplitude: 78,
        frequency: 0.007,
        phase: Math.PI * 2.45,
        speed: 0.0058,
        verticalSpeed: -0.4,
        gradientColors: ['rgba(255, 255, 255, 0.12)', 'rgba(245, 245, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 138,
        frequency: 0.0033,
        phase: Math.PI * 2.65,
        speed: 0.0024,
        verticalSpeed: 0.29,
        gradientColors: ['rgba(255, 255, 255, 0.17)', 'rgba(240, 250, 255, 0.11)'],
        lineWidth: 5
    },
    {
        amplitude: 95,
        frequency: 0.006,
        phase: Math.PI * 2.85,
        speed: 0.0046,
        verticalSpeed: -0.33,
        gradientColors: ['rgba(255, 255, 255, 0.13)', 'rgba(250, 250, 255, 0.08)'],
        lineWidth: 3
    },
    {
        amplitude: 128,
        frequency: 0.004,
        phase: Math.PI * 3.05,
        speed: 0.0033,
        verticalSpeed: 0.26,
        gradientColors: ['rgba(255, 255, 255, 0.15)', 'rgba(235, 240, 255, 0.1)'],
        lineWidth: 4
    },
    {
        amplitude: 71,
        frequency: 0.0079,
        phase: Math.PI * 3.25,
        speed: 0.0065,
        verticalSpeed: -0.45,
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(245, 250, 255, 0.06)'],
        lineWidth: 3
    },
    {
        amplitude: 148,
        frequency: 0.0037,
        phase: Math.PI * 3.45,
        speed: 0.0028,
        verticalSpeed: 0.32,
        gradientColors: ['rgba(255, 255, 255, 0.16)', 'rgba(240, 245, 255, 0.11)'],
        lineWidth: 5
    },
    {
        amplitude: 111,
        frequency: 0.0051,
        phase: Math.PI * 3.65,
        speed: 0.004,
        verticalSpeed: -0.35,
        gradientColors: ['rgba(255, 255, 255, 0.12)', 'rgba(250, 250, 255, 0.07)'],
        lineWidth: 4
    },
    {
        amplitude: 91,
        frequency: 0.0066,
        phase: Math.PI * 3.85,
        speed: 0.0053,
        verticalSpeed: 0.38,
        gradientColors: ['rgba(255, 255, 255, 0.11)', 'rgba(240, 240, 255, 0.06)'],
        lineWidth: 3
    },
    {
        amplitude: 131,
        frequency: 0.0042,
        phase: Math.PI * 4.05,
        speed: 0.0034,
        verticalSpeed: -0.27,
        gradientColors: ['rgba(255, 255, 255, 0.14)', 'rgba(235, 245, 255, 0.09)'],
        lineWidth: 4
    },
    {
        amplitude: 105,
        frequency: 0.0056,
        phase: Math.PI * 4.25,
        speed: 0.0044,
        verticalSpeed: 0.41,
        gradientColors: ['rgba(255, 255, 255, 0.13)', 'rgba(245, 250, 255, 0.08)'],
        lineWidth: 3
    },
    {
        amplitude: 96,
        frequency: 0.0063,
        phase: Math.PI * 4.45,
        speed: 0.0052,
        verticalSpeed: -0.49,
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(250, 250, 255, 0.06)'],
        lineWidth: 3
    },

    // Третья партия - еще 12 волн
    {
        amplitude: 100,
        frequency: 0.005,
        phase: Math.PI * 4.65,
        speed: 0.0037,
        verticalSpeed: 0.3,
        gradientColors: ['rgba(255, 255, 255, 0.13)', 'rgba(240, 245, 255, 0.08)'],
        lineWidth: 3
    },
    {
        amplitude: 121,
        frequency: 0.0045,
        phase: Math.PI * 4.85,
        speed: 0.0035,
        verticalSpeed: -0.37,
        gradientColors: ['rgba(255, 255, 255, 0.15)', 'rgba(235, 240, 255, 0.1)'],
        lineWidth: 4
    },
    {
        amplitude: 84,
        frequency: 0.0067,
        phase: Math.PI * 5.05,
        speed: 0.0055,
        verticalSpeed: 0.42,
        gradientColors: ['rgba(255, 255, 255, 0.11)', 'rgba(245, 245, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 141,
        frequency: 0.0035,
        phase: Math.PI * 5.25,
        speed: 0.0026,
        verticalSpeed: -0.3,
        gradientColors: ['rgba(255, 255, 255, 0.17)', 'rgba(240, 250, 255, 0.12)'],
        lineWidth: 5
    },
    {
        amplitude: 106,
        frequency: 0.0055,
        phase: Math.PI * 5.45,
        speed: 0.0042,
        verticalSpeed: 0.34,
        gradientColors: ['rgba(255, 255, 255, 0.12)', 'rgba(250, 250, 255, 0.07)'],
        lineWidth: 4
    },
    {
        amplitude: 75,
        frequency: 0.0075,
        phase: Math.PI * 5.65,
        speed: 0.0062,
        verticalSpeed: -0.46,
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(235, 245, 255, 0.06)'],
        lineWidth: 3
    },
    {
        amplitude: 145,
        frequency: 0.0038,
        phase: Math.PI * 5.85,
        speed: 0.0029,
        verticalSpeed: 0.28,
        gradientColors: ['rgba(255, 255, 255, 0.16)', 'rgba(245, 250, 255, 0.11)'],
        lineWidth: 5
    },
    {
        amplitude: 115,
        frequency: 0.0049,
        phase: Math.PI * 6.05,
        speed: 0.0038,
        verticalSpeed: -0.36,
        gradientColors: ['rgba(255, 255, 255, 0.14)', 'rgba(240, 240, 255, 0.09)'],
        lineWidth: 4
    },
    {
        amplitude: 89,
        frequency: 0.0065,
        phase: Math.PI * 6.25,
        speed: 0.005,
        verticalSpeed: 0.39,
        gradientColors: ['rgba(255, 255, 255, 0.11)', 'rgba(250, 250, 255, 0.06)'],
        lineWidth: 3
    },
    {
        amplitude: 130,
        frequency: 0.0043,
        phase: Math.PI * 6.45,
        speed: 0.0036,
        verticalSpeed: -0.25,
        gradientColors: ['rgba(255, 255, 255, 0.15)', 'rgba(235, 245, 255, 0.1)'],
        lineWidth: 4
    },
    {
        amplitude: 102,
        frequency: 0.0058,
        phase: Math.PI * 6.65,
        speed: 0.0047,
        verticalSpeed: 0.41,
        gradientColors: ['rgba(255, 255, 255, 0.12)', 'rgba(245, 250, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 94,
        frequency: 0.0062,
        phase: Math.PI * 6.85,
        speed: 0.0048,
        verticalSpeed: -0.5,
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(240, 245, 255, 0.06)'],
        lineWidth: 3
    },

    // Четвертая партия - последние 12 волн
    {
        amplitude: 108,
        frequency: 0.0048,
        phase: Math.PI * 7.05,
        speed: 0.0041,
        verticalSpeed: 0.32,
        gradientColors: ['rgba(255, 255, 255, 0.13)', 'rgba(250, 250, 255, 0.08)'],
        lineWidth: 4
    },
    {
        amplitude: 81,
        frequency: 0.0069,
        phase: Math.PI * 7.25,
        speed: 0.0056,
        verticalSpeed: -0.4,
        gradientColors: ['rgba(255, 255, 255, 0.11)', 'rgba(235, 240, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 136,
        frequency: 0.0034,
        phase: Math.PI * 7.45,
        speed: 0.0025,
        verticalSpeed: 0.27,
        gradientColors: ['rgba(255, 255, 255, 0.16)', 'rgba(245, 250, 255, 0.11)'],
        lineWidth: 5
    },
    {
        amplitude: 97,
        frequency: 0.0059,
        phase: Math.PI * 7.65,
        speed: 0.0045,
        verticalSpeed: -0.35,
        gradientColors: ['rgba(255, 255, 255, 0.12)', 'rgba(240, 245, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 125,
        frequency: 0.0044,
        phase: Math.PI * 7.85,
        speed: 0.0033,
        verticalSpeed: 0.24,
        gradientColors: ['rgba(255, 255, 255, 0.14)', 'rgba(250, 250, 255, 0.09)'],
        lineWidth: 4
    },
    {
        amplitude: 72,
        frequency: 0.0078,
        phase: Math.PI * 8.05,
        speed: 0.0064,
        verticalSpeed: -0.48,
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(235, 245, 255, 0.06)'],
        lineWidth: 3
    },
    {
        amplitude: 151,
        frequency: 0.0039,
        phase: Math.PI * 8.25,
        speed: 0.003,
        verticalSpeed: 0.33,
        gradientColors: ['rgba(255, 255, 255, 0.17)', 'rgba(240, 250, 255, 0.12)'],
        lineWidth: 5
    },
    {
        amplitude: 110,
        frequency: 0.0052,
        phase: Math.PI * 8.45,
        speed: 0.0039,
        verticalSpeed: -0.37,
        gradientColors: ['rgba(255, 255, 255, 0.13)', 'rgba(245, 245, 255, 0.08)'],
        lineWidth: 4
    },
    {
        amplitude: 92,
        frequency: 0.0066,
        phase: Math.PI * 8.65,
        speed: 0.0054,
        verticalSpeed: 0.4,
        gradientColors: ['rgba(255, 255, 255, 0.11)', 'rgba(250, 250, 255, 0.06)'],
        lineWidth: 3
    },
    {
        amplitude: 134,
        frequency: 0.0041,
        phase: Math.PI * 8.85,
        speed: 0.0035,
        verticalSpeed: -0.26,
        gradientColors: ['rgba(255, 255, 255, 0.15)', 'rgba(235, 245, 255, 0.1)'],
        lineWidth: 4
    },
    {
        amplitude: 104,
        frequency: 0.0057,
        phase: Math.PI * 9.05,
        speed: 0.0043,
        verticalSpeed: 0.42,
        gradientColors: ['rgba(255, 255, 255, 0.12)', 'rgba(240, 250, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 98,
        frequency: 0.0064,
        phase: Math.PI * 9.25,
        speed: 0.005,
        verticalSpeed: -0.52,
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(245, 250, 255, 0.06)'],
        lineWidth: 3
    },

    // Пятая партия - 12 волн
    {
        amplitude: 116,
        frequency: 0.0046,
        phase: Math.PI * 9.45,
        speed: 0.0036,
        verticalSpeed: 0.31,
        gradientColors: ['rgba(255, 255, 255, 0.14)', 'rgba(240, 245, 255, 0.09)'],
        lineWidth: 4
    },
    {
        amplitude: 79,
        frequency: 0.0071,
        phase: Math.PI * 9.65,
        speed: 0.0059,
        verticalSpeed: -0.44,
        gradientColors: ['rgba(255, 255, 255, 0.11)', 'rgba(250, 250, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 143,
        frequency: 0.0036,
        phase: Math.PI * 9.85,
        speed: 0.0027,
        verticalSpeed: 0.29,
        gradientColors: ['rgba(255, 255, 255, 0.18)', 'rgba(235, 250, 255, 0.12)'],
        lineWidth: 5
    },
    {
        amplitude: 99,
        frequency: 0.0061,
        phase: Math.PI * 10.05,
        speed: 0.0048,
        verticalSpeed: -0.38,
        gradientColors: ['rgba(255, 255, 255, 0.12)', 'rgba(245, 245, 255, 0.08)'],
        lineWidth: 3
    },
    {
        amplitude: 127,
        frequency: 0.0043,
        phase: Math.PI * 10.25,
        speed: 0.0034,
        verticalSpeed: 0.25,
        gradientColors: ['rgba(255, 255, 255, 0.15)', 'rgba(240, 240, 255, 0.1)'],
        lineWidth: 4
    },
    {
        amplitude: 74,
        frequency: 0.0076,
        phase: Math.PI * 10.45,
        speed: 0.0063,
        verticalSpeed: -0.47,
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(250, 250, 255, 0.06)'],
        lineWidth: 3
    },
    {
        amplitude: 149,
        frequency: 0.004,
        phase: Math.PI * 10.65,
        speed: 0.0031,
        verticalSpeed: 0.34,
        gradientColors: ['rgba(255, 255, 255, 0.17)', 'rgba(235, 245, 255, 0.11)'],
        lineWidth: 5
    },
    {
        amplitude: 112,
        frequency: 0.0054,
        phase: Math.PI * 10.85,
        speed: 0.0041,
        verticalSpeed: -0.36,
        gradientColors: ['rgba(255, 255, 255, 0.13)', 'rgba(245, 250, 255, 0.08)'],
        lineWidth: 4
    },
    {
        amplitude: 86,
        frequency: 0.0068,
        phase: Math.PI * 11.05,
        speed: 0.0051,
        verticalSpeed: 0.4,
        gradientColors: ['rgba(255, 255, 255, 0.11)', 'rgba(240, 245, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 132,
        frequency: 0.0044,
        phase: Math.PI * 11.25,
        speed: 0.0037,
        verticalSpeed: -0.28,
        gradientColors: ['rgba(255, 255, 255, 0.16)', 'rgba(235, 240, 255, 0.1)'],
        lineWidth: 4
    },
    {
        amplitude: 107,
        frequency: 0.0053,
        phase: Math.PI * 11.45,
        speed: 0.0046,
        verticalSpeed: 0.43,
        gradientColors: ['rgba(255, 255, 255, 0.12)', 'rgba(250, 250, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 95,
        frequency: 0.0065,
        phase: Math.PI * 11.65,
        speed: 0.0049,
        verticalSpeed: -0.51,
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(245, 250, 255, 0.06)'],
        lineWidth: 3
    },

    // Шестая партия - 12 волн
    {
        amplitude: 119,
        frequency: 0.0047,
        phase: Math.PI * 11.85,
        speed: 0.0038,
        verticalSpeed: 0.33,
        gradientColors: ['rgba(255, 255, 255, 0.14)', 'rgba(240, 250, 255, 0.09)'],
        lineWidth: 4
    },
    {
        amplitude: 82,
        frequency: 0.0072,
        phase: Math.PI * 12.05,
        speed: 0.006,
        verticalSpeed: -0.41,
        gradientColors: ['rgba(255, 255, 255, 0.11)', 'rgba(235, 245, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 139,
        frequency: 0.0037,
        phase: Math.PI * 12.25,
        speed: 0.0028,
        verticalSpeed: 0.3,
        gradientColors: ['rgba(255, 255, 255, 0.17)', 'rgba(245, 245, 255, 0.12)'],
        lineWidth: 5
    },
    {
        amplitude: 101,
        frequency: 0.0062,
        phase: Math.PI * 12.45,
        speed: 0.0047,
        verticalSpeed: -0.37,
        gradientColors: ['rgba(255, 255, 255, 0.12)', 'rgba(250, 250, 255, 0.08)'],
        lineWidth: 3
    },
    {
        amplitude: 124,
        frequency: 0.0045,
        phase: Math.PI * 12.65,
        speed: 0.0035,
        verticalSpeed: 0.27,
        gradientColors: ['rgba(255, 255, 255, 0.15)', 'rgba(240, 245, 255, 0.1)'],
        lineWidth: 4
    },
    {
        amplitude: 76,
        frequency: 0.0074,
        phase: Math.PI * 12.85,
        speed: 0.0061,
        verticalSpeed: -0.46,
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(235, 250, 255, 0.06)'],
        lineWidth: 3
    },
    {
        amplitude: 146,
        frequency: 0.0038,
        phase: Math.PI * 13.05,
        speed: 0.0029,
        verticalSpeed: 0.32,
        gradientColors: ['rgba(255, 255, 255, 0.16)', 'rgba(250, 250, 255, 0.11)'],
        lineWidth: 5
    },
    {
        amplitude: 114,
        frequency: 0.0051,
        phase: Math.PI * 13.25,
        speed: 0.004,
        verticalSpeed: -0.35,
        gradientColors: ['rgba(255, 255, 255, 0.13)', 'rgba(245, 250, 255, 0.08)'],
        lineWidth: 4
    },
    {
        amplitude: 88,
        frequency: 0.0067,
        phase: Math.PI * 13.45,
        speed: 0.0052,
        verticalSpeed: 0.39,
        gradientColors: ['rgba(255, 255, 255, 0.11)', 'rgba(240, 240, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 129,
        frequency: 0.0046,
        phase: Math.PI * 13.65,
        speed: 0.0036,
        verticalSpeed: -0.26,
        gradientColors: ['rgba(255, 255, 255, 0.15)', 'rgba(235, 245, 255, 0.1)'],
        lineWidth: 4
    },
    {
        amplitude: 103,
        frequency: 0.0059,
        phase: Math.PI * 13.85,
        speed: 0.0045,
        verticalSpeed: 0.42,
        gradientColors: ['rgba(255, 255, 255, 0.12)', 'rgba(245, 245, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 97,
        frequency: 0.0063,
        phase: Math.PI * 14.05,
        speed: 0.005,
        verticalSpeed: -0.49,
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(250, 250, 255, 0.06)'],
        lineWidth: 3
    },

    // Седьмая партия - 12 волн
    {
        amplitude: 117,
        frequency: 0.0049,
        phase: Math.PI * 14.25,
        speed: 0.0039,
        verticalSpeed: 0.34,
        gradientColors: ['rgba(255, 255, 255, 0.14)', 'rgba(240, 245, 255, 0.09)'],
        lineWidth: 4
    },
    {
        amplitude: 80,
        frequency: 0.0073,
        phase: Math.PI * 14.45,
        speed: 0.0058,
        verticalSpeed: -0.43,
        gradientColors: ['rgba(255, 255, 255, 0.11)', 'rgba(235, 240, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 142,
        frequency: 0.0035,
        phase: Math.PI * 14.65,
        speed: 0.0026,
        verticalSpeed: 0.28,
        gradientColors: ['rgba(255, 255, 255, 0.18)', 'rgba(250, 250, 255, 0.12)'],
        lineWidth: 5
    },
    {
        amplitude: 104,
        frequency: 0.006,
        phase: Math.PI * 14.85,
        speed: 0.0046,
        verticalSpeed: -0.36,
        gradientColors: ['rgba(255, 255, 255, 0.12)', 'rgba(245, 250, 255, 0.08)'],
        lineWidth: 3
    },
    {
        amplitude: 126,
        frequency: 0.0042,
        phase: Math.PI * 15.05,
        speed: 0.0033,
        verticalSpeed: 0.26,
        gradientColors: ['rgba(255, 255, 255, 0.15)', 'rgba(240, 250, 255, 0.1)'],
        lineWidth: 4
    },
    {
        amplitude: 77,
        frequency: 0.0077,
        phase: Math.PI * 15.25,
        speed: 0.0064,
        verticalSpeed: -0.48,
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(235, 245, 255, 0.06)'],
        lineWidth: 3
    },
    {
        amplitude: 150,
        frequency: 0.0039,
        phase: Math.PI * 15.45,
        speed: 0.003,
        verticalSpeed: 0.31,
        gradientColors: ['rgba(255, 255, 255, 0.17)', 'rgba(245, 245, 255, 0.11)'],
        lineWidth: 5
    },
    {
        amplitude: 109,
        frequency: 0.0053,
        phase: Math.PI * 15.65,
        speed: 0.0042,
        verticalSpeed: -0.34,
        gradientColors: ['rgba(255, 255, 255, 0.13)', 'rgba(250, 250, 255, 0.08)'],
        lineWidth: 4
    },
    {
        amplitude: 90,
        frequency: 0.0069,
        phase: Math.PI * 15.85,
        speed: 0.0053,
        verticalSpeed: 0.41,
        gradientColors: ['rgba(255, 255, 255, 0.11)', 'rgba(240, 245, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 135,
        frequency: 0.0041,
        phase: Math.PI * 16.05,
        speed: 0.0032,
        verticalSpeed: -0.27,
        gradientColors: ['rgba(255, 255, 255, 0.16)', 'rgba(235, 250, 255, 0.1)'],
        lineWidth: 4
    },
    {
        amplitude: 105,
        frequency: 0.0057,
        phase: Math.PI * 16.25,
        speed: 0.0044,
        verticalSpeed: 0.4,
        gradientColors: ['rgba(255, 255, 255, 0.12)', 'rgba(245, 250, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 93,
        frequency: 0.0064,
        phase: Math.PI * 16.45,
        speed: 0.0051,
        verticalSpeed: -0.5,
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(240, 250, 255, 0.06)'],
        lineWidth: 3
    },

    // Восьмая партия - 12 волн
    {
        amplitude: 122,
        frequency: 0.0048,
        phase: Math.PI * 16.65,
        speed: 0.0037,
        verticalSpeed: 0.35,
        gradientColors: ['rgba(255, 255, 255, 0.14)', 'rgba(235, 245, 255, 0.09)'],
        lineWidth: 4
    },
    {
        amplitude: 83,
        frequency: 0.007,
        phase: Math.PI * 16.85,
        speed: 0.0057,
        verticalSpeed: -0.42,
        gradientColors: ['rgba(255, 255, 255, 0.11)', 'rgba(250, 250, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 140,
        frequency: 0.0034,
        phase: Math.PI * 17.05,
        speed: 0.0025,
        verticalSpeed: 0.29,
        gradientColors: ['rgba(255, 255, 255, 0.17)', 'rgba(240, 245, 255, 0.12)'],
        lineWidth: 5
    },
    {
        amplitude: 98,
        frequency: 0.0061,
        phase: Math.PI * 17.25,
        speed: 0.0047,
        verticalSpeed: -0.38,
        gradientColors: ['rgba(255, 255, 255, 0.12)', 'rgba(245, 245, 255, 0.08)'],
        lineWidth: 3
    },
    {
        amplitude: 123,
        frequency: 0.0043,
        phase: Math.PI * 17.45,
        speed: 0.0034,
        verticalSpeed: 0.24,
        gradientColors: ['rgba(255, 255, 255, 0.15)', 'rgba(235, 240, 255, 0.1)'],
        lineWidth: 4
    },
    {
        amplitude: 70,
        frequency: 0.008,
        phase: Math.PI * 17.65,
        speed: 0.0066,
        verticalSpeed: -0.45,
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(250, 250, 255, 0.06)'],
        lineWidth: 3
    },
    {
        amplitude: 147,
        frequency: 0.0037,
        phase: Math.PI * 17.85,
        speed: 0.0028,
        verticalSpeed: 0.33,
        gradientColors: ['rgba(255, 255, 255, 0.16)', 'rgba(245, 250, 255, 0.11)'],
        lineWidth: 5
    },
    {
        amplitude: 111,
        frequency: 0.0052,
        phase: Math.PI * 18.05,
        speed: 0.0041,
        verticalSpeed: -0.35,
        gradientColors: ['rgba(255, 255, 255, 0.13)', 'rgba(240, 250, 255, 0.08)'],
        lineWidth: 4
    },
    {
        amplitude: 87,
        frequency: 0.0068,
        phase: Math.PI * 18.25,
        speed: 0.0054,
        verticalSpeed: 0.38,
        gradientColors: ['rgba(255, 255, 255, 0.11)', 'rgba(235, 245, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 133,
        frequency: 0.004,
        phase: Math.PI * 18.45,
        speed: 0.0031,
        verticalSpeed: -0.25,
        gradientColors: ['rgba(255, 255, 255, 0.15)', 'rgba(250, 250, 255, 0.1)'],
        lineWidth: 4
    },
    {
        amplitude: 106,
        frequency: 0.0056,
        phase: Math.PI * 18.65,
        speed: 0.0045,
        verticalSpeed: 0.44,
        gradientColors: ['rgba(255, 255, 255, 0.12)', 'rgba(240, 245, 255, 0.07)'],
        lineWidth: 3
    },
    {
        amplitude: 96,
        frequency: 0.0065,
        phase: Math.PI * 18.85,
        speed: 0.0052,
        verticalSpeed: -0.52,
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(245, 250, 255, 0.06)'],
        lineWidth: 3
    }
];