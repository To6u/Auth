import { describe, expect, it } from 'vitest';
import { getWeekStart } from './dateUtils';

describe('getWeekStart', () => {
    it('воскресенье → понедельник на прошлой неделе', () => {
        // 2026-04-05 — воскресенье
        const result = getWeekStart(new Date('2026-04-05'));
        expect(result).toBe('2026-03-30');
    });

    it('суббота → ближайший прошедший понедельник', () => {
        // 2026-04-04 — суббота
        const result = getWeekStart(new Date('2026-04-04'));
        expect(result).toBe('2026-03-30');
    });

    it('понедельник → тот же день', () => {
        // 2026-03-30 — понедельник
        const result = getWeekStart(new Date('2026-03-30'));
        expect(result).toBe('2026-03-30');
    });

    it('пятница → ближайший прошедший понедельник', () => {
        // 2026-04-03 — пятница
        const result = getWeekStart(new Date('2026-04-03'));
        expect(result).toBe('2026-03-30');
    });
});
