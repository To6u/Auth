import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Hero from './Hero';

describe('Hero', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('рендерит секцию с id="deer"', () => {
        const { container } = render(<Hero />);
        expect(container.querySelector('#deer')).toBeTruthy();
    });

    it('hero__content не имеет класса visible до 200ms', () => {
        const { container } = render(<Hero />);
        const content = container.querySelector('.hero__content');
        expect(content?.className).not.toContain('visible');
    });

    it('hero__content получает класс visible после 200ms', () => {
        const { container } = render(<Hero />);
        act(() => {
            vi.advanceTimersByTime(200);
        });
        const content = container.querySelector('.hero__content');
        expect(content?.className).toContain('visible');
    });

    it('рендерит 4 буквы D, E, E, R', () => {
        const { container } = render(<Hero />);
        const letters = container.querySelectorAll('.letter');
        const texts = Array.from(letters).map((el) => el.textContent);
        expect(texts).toEqual(['D', 'E', 'E', 'R']);
    });

    it('очищает таймер при анмонте (нет утечек)', () => {
        const { unmount } = render(<Hero />);
        const clearSpy = vi.spyOn(global, 'clearTimeout');
        unmount();
        expect(clearSpy).toHaveBeenCalled();
    });
});
