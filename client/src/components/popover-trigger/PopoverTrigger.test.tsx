import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PopoverTrigger } from './PopoverTrigger';

describe('PopoverTrigger', () => {
    let showPopover: ReturnType<typeof vi.fn>;
    let hidePopover: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Popover API отсутствует в jsdom — мокаем на прототипе
        showPopover = vi.fn();
        hidePopover = vi.fn();
        HTMLElement.prototype.showPopover = showPopover;
        HTMLElement.prototype.hidePopover = hidePopover;
    });

    afterEach(() => {
        // Удаляем из прототипа чтобы не аффектить другие тесты
        // @ts-expect-error — удаляем мок
        delete HTMLElement.prototype.showPopover;
        // @ts-expect-error
        delete HTMLElement.prototype.hidePopover;
    });

    it('рендерит дочерний контент внутри тега <b>', () => {
        render(
            <PopoverTrigger id="test-pop" content="Подсказка">
                Наведи на меня
            </PopoverTrigger>
        );
        expect(screen.getByText('Наведи на меня').tagName).toBe('B');
    });

    it('рендерит popover-элемент с переданным контентом', () => {
        render(
            <PopoverTrigger id="test-pop" content="Текст подсказки">
                trigger
            </PopoverTrigger>
        );
        expect(screen.getByText('Текст подсказки')).toBeInTheDocument();
    });

    it('вызывает showPopover при наведении на триггер', async () => {
        const user = userEvent.setup({ delay: null });
        render(
            <PopoverTrigger id="test-pop" content="hint">
                trigger
            </PopoverTrigger>
        );
        await user.hover(screen.getByText('trigger'));
        expect(showPopover).toHaveBeenCalledOnce();
    });

    it('вызывает hidePopover при уходе курсора', async () => {
        const user = userEvent.setup({ delay: null });
        render(
            <PopoverTrigger id="test-pop" content="hint">
                trigger
            </PopoverTrigger>
        );
        await user.hover(screen.getByText('trigger'));
        await user.unhover(screen.getByText('trigger'));
        expect(hidePopover).toHaveBeenCalledOnce();
    });

    it('popover имеет атрибут popover="manual"', () => {
        render(
            <PopoverTrigger id="my-pop" content="hint">
                trigger
            </PopoverTrigger>
        );
        const popoverEl = document.getElementById('my-pop');
        expect(popoverEl?.getAttribute('popover')).toBe('manual');
    });
});
