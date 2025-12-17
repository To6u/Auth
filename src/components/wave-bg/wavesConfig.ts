export interface WaveConfig {
    amplitude: number;
    frequency: number;
    phase: number;
    speed: number;
    verticalSpeed: number;
    gradientColors: [string, string];
    lineWidth: number;
}

// Настройка общей скорости анимации (от 1 до 10)
// 1 = супермедленно, 10 = текущая скорость
export const WAVE_SPEED_MULTIPLIER = 1; // Измените это значение от 1 до 10

export const wavesConfig: WaveConfig[] = [
    // Первая партия - 12 волн
    {
        amplitude: 100,
        frequency: 0.005,
        phase: 0,
        speed: 0.00375,
        verticalSpeed: 0.3,
        gradientColors: ['rgba(255, 193, 7, 0.6)', 'rgba(76, 175, 80, 0.5)'],
        lineWidth: 150
    },
    {
        amplitude: 80,
        frequency: 0.007,
        phase: Math.PI / 6,
        speed: 0.0055,
        verticalSpeed: -0.4,
        gradientColors: ['rgba(244, 67, 54, 0.5)', 'rgba(233, 30, 99, 0.4)'],
        lineWidth: 120
    },
    {
        amplitude: 140,
        frequency: 0.003,
        phase: Math.PI / 3,
        speed: 0.002,
        verticalSpeed: 0.25,
        gradientColors: ['rgba(3, 169, 244, 0.55)', 'rgba(103, 58, 183, 0.45)'],
        lineWidth: 200
    },
    {
        amplitude: 95,
        frequency: 0.006,
        phase: Math.PI / 2,
        speed: 0.0045,
        verticalSpeed: -0.35,
        gradientColors: ['rgba(255, 152, 0, 0.45)', 'rgba(255, 87, 34, 0.35)'],
        lineWidth: 140
    },
    {
        amplitude: 120,
        frequency: 0.004,
        phase: Math.PI / 1.5,
        speed: 0.003,
        verticalSpeed: 0.2,
        gradientColors: ['rgba(0, 188, 212, 0.5)', 'rgba(0, 150, 136, 0.4)'],
        lineWidth: 170
    },
    {
        amplitude: 70,
        frequency: 0.008,
        phase: Math.PI,
        speed: 0.00625,
        verticalSpeed: -0.45,
        gradientColors: ['rgba(156, 39, 176, 0.4)', 'rgba(103, 58, 183, 0.3)'],
        lineWidth: 110
    },
    {
        amplitude: 150,
        frequency: 0.0035,
        phase: Math.PI * 1.2,
        speed: 0.0025,
        verticalSpeed: 0.28,
        gradientColors: ['rgba(139, 195, 74, 0.55)', 'rgba(205, 220, 57, 0.45)'],
        lineWidth: 210
    },
    {
        amplitude: 110,
        frequency: 0.0055,
        phase: Math.PI * 1.4,
        speed: 0.004,
        verticalSpeed: -0.32,
        gradientColors: ['rgba(255, 87, 34, 0.45)', 'rgba(244, 67, 54, 0.35)'],
        lineWidth: 160
    },
    {
        amplitude: 85,
        frequency: 0.0065,
        phase: Math.PI * 1.6,
        speed: 0.005,
        verticalSpeed: 0.38,
        gradientColors: ['rgba(63, 81, 181, 0.5)', 'rgba(33, 150, 243, 0.4)'],
        lineWidth: 130
    },
    {
        amplitude: 130,
        frequency: 0.0042,
        phase: Math.PI * 1.8,
        speed: 0.00325,
        verticalSpeed: -0.22,
        gradientColors: ['rgba(255, 235, 59, 0.5)', 'rgba(255, 193, 7, 0.4)'],
        lineWidth: 185
    },
    {
        amplitude: 105,
        frequency: 0.0058,
        phase: Math.PI * 1.9,
        speed: 0.00475,
        verticalSpeed: 0.42,
        gradientColors: ['rgba(233, 30, 99, 0.4)', 'rgba(156, 39, 176, 0.3)'],
        lineWidth: 155
    },
    {
        amplitude: 90,
        frequency: 0.0062,
        phase: Math.PI * 2.1,
        speed: 0.00525,
        verticalSpeed: -0.5,
        gradientColors: ['rgba(0, 150, 136, 0.35)', 'rgba(76, 175, 80, 0.25)'],
        lineWidth: 135
    },

    // Вторая партия - еще 12 волн
    {
        amplitude: 115,
        frequency: 0.0048,
        phase: Math.PI * 2.3,
        speed: 0.0042,
        verticalSpeed: 0.33,
        gradientColors: ['rgba(121, 85, 72, 0.5)', 'rgba(255, 138, 101, 0.4)'],
        lineWidth: 145
    },
    {
        amplitude: 75,
        frequency: 0.0072,
        phase: Math.PI * 2.5,
        speed: 0.006,
        verticalSpeed: -0.38,
        gradientColors: ['rgba(158, 158, 158, 0.45)', 'rgba(189, 189, 189, 0.35)'],
        lineWidth: 125
    },
    {
        amplitude: 135,
        frequency: 0.0032,
        phase: Math.PI * 2.7,
        speed: 0.0023,
        verticalSpeed: 0.27,
        gradientColors: ['rgba(255, 112, 67, 0.55)', 'rgba(255, 193, 7, 0.45)'],
        lineWidth: 195
    },
    {
        amplitude: 92,
        frequency: 0.0061,
        phase: Math.PI * 2.9,
        speed: 0.0048,
        verticalSpeed: -0.31,
        gradientColors: ['rgba(0, 200, 83, 0.5)', 'rgba(100, 221, 23, 0.4)'],
        lineWidth: 138
    },
    {
        amplitude: 125,
        frequency: 0.0041,
        phase: Math.PI * 3.1,
        speed: 0.0032,
        verticalSpeed: 0.24,
        gradientColors: ['rgba(213, 0, 249, 0.48)', 'rgba(251, 140, 0, 0.38)'],
        lineWidth: 175
    },
    {
        amplitude: 68,
        frequency: 0.0082,
        phase: Math.PI * 3.3,
        speed: 0.0067,
        verticalSpeed: -0.43,
        gradientColors: ['rgba(29, 233, 182, 0.42)', 'rgba(67, 233, 123, 0.32)'],
        lineWidth: 115
    },
    {
        amplitude: 145,
        frequency: 0.0036,
        phase: Math.PI * 3.5,
        speed: 0.0027,
        verticalSpeed: 0.29,
        gradientColors: ['rgba(238, 9, 121, 0.53)', 'rgba(255, 106, 0, 0.43)'],
        lineWidth: 205
    },
    {
        amplitude: 108,
        frequency: 0.0053,
        phase: Math.PI * 3.7,
        speed: 0.0041,
        verticalSpeed: -0.34,
        gradientColors: ['rgba(41, 98, 255, 0.47)', 'rgba(0, 229, 255, 0.37)'],
        lineWidth: 163
    },
    {
        amplitude: 88,
        frequency: 0.0067,
        phase: Math.PI * 3.9,
        speed: 0.0052,
        verticalSpeed: 0.36,
        gradientColors: ['rgba(255, 0, 110, 0.49)', 'rgba(255, 171, 0, 0.39)'],
        lineWidth: 133
    },
    {
        amplitude: 128,
        frequency: 0.0043,
        phase: Math.PI * 4.1,
        speed: 0.0034,
        verticalSpeed: -0.25,
        gradientColors: ['rgba(16, 172, 132, 0.51)', 'rgba(42, 245, 152, 0.41)'],
        lineWidth: 180
    },
    {
        amplitude: 102,
        frequency: 0.0057,
        phase: Math.PI * 4.3,
        speed: 0.0046,
        verticalSpeed: 0.39,
        gradientColors: ['rgba(131, 58, 180, 0.44)', 'rgba(253, 29, 29, 0.34)'],
        lineWidth: 152
    },
    {
        amplitude: 93,
        frequency: 0.0064,
        phase: Math.PI * 4.5,
        speed: 0.0054,
        verticalSpeed: -0.47,
        gradientColors: ['rgba(0, 210, 255, 0.38)', 'rgba(58, 123, 213, 0.28)'],
        lineWidth: 142
    },

    // Третья партия - еще 12 волн
    {
        amplitude: 118,
        frequency: 0.0051,
        phase: Math.PI * 4.7,
        speed: 0.0039,
        verticalSpeed: 0.31,
        gradientColors: ['rgba(255, 87, 34, 0.52)', 'rgba(255, 202, 40, 0.42)'],
        lineWidth: 168
    },
    {
        amplitude: 82,
        frequency: 0.0069,
        phase: Math.PI * 4.9,
        speed: 0.0058,
        verticalSpeed: -0.41,
        gradientColors: ['rgba(103, 58, 183, 0.46)', 'rgba(171, 71, 188, 0.36)'],
        lineWidth: 128
    },
    {
        amplitude: 138,
        frequency: 0.0038,
        phase: Math.PI * 5.1,
        speed: 0.0029,
        verticalSpeed: 0.26,
        gradientColors: ['rgba(0, 188, 212, 0.54)', 'rgba(0, 230, 118, 0.44)'],
        lineWidth: 198
    },
    {
        amplitude: 96,
        frequency: 0.0063,
        phase: Math.PI * 5.3,
        speed: 0.0049,
        verticalSpeed: -0.37,
        gradientColors: ['rgba(244, 67, 54, 0.48)', 'rgba(233, 30, 99, 0.38)'],
        lineWidth: 147
    },
    {
        amplitude: 112,
        frequency: 0.0047,
        phase: Math.PI * 5.5,
        speed: 0.0036,
        verticalSpeed: 0.33,
        gradientColors: ['rgba(76, 175, 80, 0.5)', 'rgba(139, 195, 74, 0.4)'],
        lineWidth: 171
    },
    {
        amplitude: 71,
        frequency: 0.0079,
        phase: Math.PI * 5.7,
        speed: 0.0064,
        verticalSpeed: -0.45,
        gradientColors: ['rgba(255, 152, 0, 0.43)', 'rgba(255, 193, 7, 0.33)'],
        lineWidth: 119
    },
    {
        amplitude: 142,
        frequency: 0.0034,
        phase: Math.PI * 5.9,
        speed: 0.0025,
        verticalSpeed: 0.28,
        gradientColors: ['rgba(156, 39, 176, 0.56)', 'rgba(233, 30, 99, 0.46)'],
        lineWidth: 208
    },
    {
        amplitude: 105,
        frequency: 0.0055,
        phase: Math.PI * 6.1,
        speed: 0.0043,
        verticalSpeed: -0.32,
        gradientColors: ['rgba(3, 169, 244, 0.49)', 'rgba(0, 188, 212, 0.39)'],
        lineWidth: 158
    },
    {
        amplitude: 85,
        frequency: 0.0071,
        phase: Math.PI * 6.3,
        speed: 0.0056,
        verticalSpeed: 0.42,
        gradientColors: ['rgba(255, 64, 129, 0.47)', 'rgba(255, 109, 0, 0.37)'],
        lineWidth: 136
    },
    {
        amplitude: 131,
        frequency: 0.0045,
        phase: Math.PI * 6.5,
        speed: 0.0031,
        verticalSpeed: -0.29,
        gradientColors: ['rgba(0, 150, 136, 0.53)', 'rgba(76, 175, 80, 0.43)'],
        lineWidth: 186
    },
    {
        amplitude: 99,
        frequency: 0.0059,
        phase: Math.PI * 6.7,
        speed: 0.0047,
        verticalSpeed: 0.35,
        gradientColors: ['rgba(121, 85, 72, 0.45)', 'rgba(161, 136, 127, 0.35)'],
        lineWidth: 149
    },
    {
        amplitude: 89,
        frequency: 0.0066,
        phase: Math.PI * 6.9,
        speed: 0.0053,
        verticalSpeed: -0.44,
        gradientColors: ['rgba(63, 81, 181, 0.41)', 'rgba(103, 58, 183, 0.31)'],
        lineWidth: 139
    },

    // Четвертая партия - 12 волн
    {
        amplitude: 143,
        frequency: 0.0037,
        phase: Math.PI * 7.1,
        speed: 0.0028,
        verticalSpeed: 0.21,
        gradientColors: ['rgba(255, 215, 0, 0.57)', 'rgba(255, 140, 0, 0.47)'],
        lineWidth: 203
    },
    {
        amplitude: 78,
        frequency: 0.0074,
        phase: Math.PI * 7.3,
        speed: 0.0061,
        verticalSpeed: -0.48,
        gradientColors: ['rgba(186, 104, 200, 0.44)', 'rgba(149, 117, 205, 0.34)'],
        lineWidth: 122
    },
    {
        amplitude: 122,
        frequency: 0.0046,
        phase: Math.PI * 7.5,
        speed: 0.0037,
        verticalSpeed: 0.34,
        gradientColors: ['rgba(38, 198, 218, 0.51)', 'rgba(102, 187, 106, 0.41)'],
        lineWidth: 177
    },
    {
        amplitude: 97,
        frequency: 0.0068,
        phase: Math.PI * 7.7,
        speed: 0.0055,
        verticalSpeed: -0.39,
        gradientColors: ['rgba(255, 61, 0, 0.49)', 'rgba(255, 179, 0, 0.39)'],
        lineWidth: 144
    },
    {
        amplitude: 136,
        frequency: 0.0033,
        phase: Math.PI * 7.9,
        speed: 0.0024,
        verticalSpeed: 0.23,
        gradientColors: ['rgba(224, 64, 251, 0.54)', 'rgba(255, 138, 101, 0.44)'],
        lineWidth: 192
    },
    {
        amplitude: 73,
        frequency: 0.0081,
        phase: Math.PI * 8.1,
        speed: 0.0066,
        verticalSpeed: -0.46,
        gradientColors: ['rgba(100, 181, 246, 0.42)', 'rgba(79, 195, 247, 0.32)'],
        lineWidth: 117
    },
    {
        amplitude: 148,
        frequency: 0.0031,
        phase: Math.PI * 8.3,
        speed: 0.0022,
        verticalSpeed: 0.27,
        gradientColors: ['rgba(129, 212, 250, 0.58)', 'rgba(255, 213, 79, 0.48)'],
        lineWidth: 213
    },
    {
        amplitude: 107,
        frequency: 0.0054,
        phase: Math.PI * 8.5,
        speed: 0.0044,
        verticalSpeed: -0.36,
        gradientColors: ['rgba(240, 98, 146, 0.46)', 'rgba(255, 64, 129, 0.36)'],
        lineWidth: 161
    },
    {
        amplitude: 84,
        frequency: 0.0073,
        phase: Math.PI * 8.7,
        speed: 0.0059,
        verticalSpeed: 0.41,
        gradientColors: ['rgba(178, 235, 242, 0.48)', 'rgba(128, 222, 234, 0.38)'],
        lineWidth: 131
    },
    {
        amplitude: 133,
        frequency: 0.0044,
        phase: Math.PI * 8.9,
        speed: 0.0035,
        verticalSpeed: -0.26,
        gradientColors: ['rgba(255, 183, 77, 0.52)', 'rgba(255, 138, 101, 0.42)'],
        lineWidth: 188
    },
    {
        amplitude: 101,
        frequency: 0.006,
        phase: Math.PI * 9.1,
        speed: 0.0049,
        verticalSpeed: 0.37,
        gradientColors: ['rgba(174, 213, 129, 0.47)', 'rgba(220, 231, 117, 0.37)'],
        lineWidth: 154
    },
    {
        amplitude: 91,
        frequency: 0.0065,
        phase: Math.PI * 9.3,
        speed: 0.0051,
        verticalSpeed: -0.49,
        gradientColors: ['rgba(255, 138, 128, 0.43)', 'rgba(255, 202, 40, 0.33)'],
        lineWidth: 141
    },

    // Пятая партия - 12 волн
    {
        amplitude: 116,
        frequency: 0.0049,
        phase: Math.PI * 9.5,
        speed: 0.004,
        verticalSpeed: 0.32,
        gradientColors: ['rgba(179, 157, 219, 0.5)', 'rgba(207, 216, 220, 0.4)'],
        lineWidth: 166
    },
    {
        amplitude: 76,
        frequency: 0.0076,
        phase: Math.PI * 9.7,
        speed: 0.0062,
        verticalSpeed: -0.42,
        gradientColors: ['rgba(255, 234, 167, 0.45)', 'rgba(255, 245, 157, 0.35)'],
        lineWidth: 124
    },
    {
        amplitude: 139,
        frequency: 0.0035,
        phase: Math.PI * 9.9,
        speed: 0.0026,
        verticalSpeed: 0.24,
        gradientColors: ['rgba(236, 64, 122, 0.56)', 'rgba(216, 27, 96, 0.46)'],
        lineWidth: 199
    },
    {
        amplitude: 94,
        frequency: 0.0062,
        phase: Math.PI * 10.1,
        speed: 0.005,
        verticalSpeed: -0.35,
        gradientColors: ['rgba(126, 87, 194, 0.48)', 'rgba(171, 71, 188, 0.38)'],
        lineWidth: 146
    },
    {
        amplitude: 127,
        frequency: 0.0042,
        phase: Math.PI * 10.3,
        speed: 0.0033,
        verticalSpeed: 0.28,
        gradientColors: ['rgba(255, 167, 38, 0.53)', 'rgba(251, 192, 45, 0.43)'],
        lineWidth: 182
    },
    {
        amplitude: 69,
        frequency: 0.0083,
        phase: Math.PI * 10.5,
        speed: 0.0068,
        verticalSpeed: -0.44,
        gradientColors: ['rgba(129, 199, 132, 0.41)', 'rgba(165, 214, 167, 0.31)'],
        lineWidth: 113
    },
    {
        amplitude: 146,
        frequency: 0.003,
        phase: Math.PI * 10.7,
        speed: 0.0021,
        verticalSpeed: 0.25,
        gradientColors: ['rgba(255, 112, 67, 0.59)', 'rgba(255, 160, 0, 0.49)'],
        lineWidth: 215
    },
    {
        amplitude: 109,
        frequency: 0.0052,
        phase: Math.PI * 10.9,
        speed: 0.0042,
        verticalSpeed: -0.33,
        gradientColors: ['rgba(66, 165, 245, 0.5)', 'rgba(41, 182, 246, 0.4)'],
        lineWidth: 164
    },
    {
        amplitude: 86,
        frequency: 0.007,
        phase: Math.PI * 11.1,
        speed: 0.0057,
        verticalSpeed: 0.4,
        gradientColors: ['rgba(255, 87, 34, 0.46)', 'rgba(244, 81, 30, 0.36)'],
        lineWidth: 134
    },
    {
        amplitude: 129,
        frequency: 0.004,
        phase: Math.PI * 11.3,
        speed: 0.003,
        verticalSpeed: -0.27,
        gradientColors: ['rgba(171, 71, 188, 0.54)', 'rgba(186, 104, 200, 0.44)'],
        lineWidth: 184
    },
    {
        amplitude: 103,
        frequency: 0.0056,
        phase: Math.PI * 11.5,
        speed: 0.0045,
        verticalSpeed: 0.38,
        gradientColors: ['rgba(255, 235, 59, 0.49)', 'rgba(255, 214, 0, 0.39)'],
        lineWidth: 156
    },
    {
        amplitude: 95,
        frequency: 0.0063,
        phase: Math.PI * 11.7,
        speed: 0.0052,
        verticalSpeed: -0.5,
        gradientColors: ['rgba(38, 166, 154, 0.44)', 'rgba(77, 182, 172, 0.34)'],
        lineWidth: 143
    },

    // Шестая партия - 12 волн
    {
        amplitude: 120,
        frequency: 0.0047,
        phase: Math.PI * 11.9,
        speed: 0.0038,
        verticalSpeed: 0.3,
        gradientColors: ['rgba(255, 138, 101, 0.51)', 'rgba(255, 171, 145, 0.41)'],
        lineWidth: 172
    },
    {
        amplitude: 80,
        frequency: 0.0075,
        phase: Math.PI * 12.1,
        speed: 0.0063,
        verticalSpeed: -0.43,
        gradientColors: ['rgba(149, 117, 205, 0.47)', 'rgba(179, 136, 235, 0.37)'],
        lineWidth: 126
    },
    {
        amplitude: 141,
        frequency: 0.0034,
        phase: Math.PI * 12.3,
        speed: 0.0027,
        verticalSpeed: 0.26,
        gradientColors: ['rgba(255, 241, 118, 0.55)', 'rgba(255, 213, 79, 0.45)'],
        lineWidth: 201
    },
    {
        amplitude: 98,
        frequency: 0.0064,
        phase: Math.PI * 12.5,
        speed: 0.0053,
        verticalSpeed: -0.37,
        gradientColors: ['rgba(239, 83, 80, 0.5)', 'rgba(229, 57, 53, 0.4)'],
        lineWidth: 148
    },
    {
        amplitude: 114,
        frequency: 0.005,
        phase: Math.PI * 12.7,
        speed: 0.0041,
        verticalSpeed: 0.31,
        gradientColors: ['rgba(66, 165, 245, 0.52)', 'rgba(100, 181, 246, 0.42)'],
        lineWidth: 169
    },
    {
        amplitude: 72,
        frequency: 0.008,
        phase: Math.PI * 12.9,
        speed: 0.0065,
        verticalSpeed: -0.47,
        gradientColors: ['rgba(255, 202, 40, 0.43)', 'rgba(255, 179, 0, 0.33)'],
        lineWidth: 116
    },
    {
        amplitude: 144,
        frequency: 0.0029,
        phase: Math.PI * 13.1,
        speed: 0.002,
        verticalSpeed: 0.22,
        gradientColors: ['rgba(198, 255, 221, 0.6)', 'rgba(129, 212, 250, 0.5)'],
        lineWidth: 210
    },
    {
        amplitude: 106,
        frequency: 0.0053,
        phase: Math.PI * 13.3,
        speed: 0.0043,
        verticalSpeed: -0.34,
        gradientColors: ['rgba(255, 112, 67, 0.48)', 'rgba(255, 138, 101, 0.38)'],
        lineWidth: 159
    },
    {
        amplitude: 87,
        frequency: 0.0072,
        phase: Math.PI * 13.5,
        speed: 0.0058,
        verticalSpeed: 0.43,
        gradientColors: ['rgba(129, 212, 250, 0.45)', 'rgba(79, 195, 247, 0.35)'],
        lineWidth: 137
    },
    {
        amplitude: 132,
        frequency: 0.0039,
        phase: Math.PI * 13.7,
        speed: 0.0029,
        verticalSpeed: -0.28,
        gradientColors: ['rgba(156, 204, 101, 0.55)', 'rgba(192, 202, 51, 0.45)'],
        lineWidth: 189
    },
    {
        amplitude: 100,
        frequency: 0.0058,
        phase: Math.PI * 13.9,
        speed: 0.0047,
        verticalSpeed: 0.36,
        gradientColors: ['rgba(244, 143, 177, 0.46)', 'rgba(240, 98, 146, 0.36)'],
        lineWidth: 151
    },
    {
        amplitude: 92,
        frequency: 0.0067,
        phase: Math.PI * 14.1,
        speed: 0.0054,
        verticalSpeed: -0.45,
        gradientColors: ['rgba(77, 208, 225, 0.42)', 'rgba(38, 198, 218, 0.32)'],
        lineWidth: 140
    }
];