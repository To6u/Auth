import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ExpandableContent } from './ExpandableContent';

function renderExpandable() {
    return render(
        <ExpandableContent>
            <p>Основной текст</p>
            <p>Скрытый текст</p>
            <p>Ещё скрытый</p>
        </ExpandableContent>
    );
}

describe('ExpandableContent', () => {
    it('показывает первый абзац сразу', () => {
        renderExpandable();
        expect(screen.getByText('Основной текст')).toBeInTheDocument();
    });

    it('скрывает контент после первого абзаца по умолчанию', () => {
        renderExpandable();
        expect(screen.queryByText('Скрытый текст')).not.toBeInTheDocument();
    });

    it('кнопка отображает "Показать больше" в свёрнутом состоянии', () => {
        renderExpandable();
        expect(screen.getByRole('button', { name: 'Показать больше' })).toBeInTheDocument();
    });

    it('кнопка имеет aria-expanded=false изначально', () => {
        renderExpandable();
        expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });

    it('клик разворачивает скрытый контент', async () => {
        const user = userEvent.setup({ delay: null });
        renderExpandable();
        await user.click(screen.getByRole('button'));
        expect(screen.getByText('Скрытый текст')).toBeInTheDocument();
        expect(screen.getByText('Ещё скрытый')).toBeInTheDocument();
    });

    it('кнопка меняет текст на "Скрыть" после раскрытия', async () => {
        const user = userEvent.setup({ delay: null });
        renderExpandable();
        await user.click(screen.getByRole('button'));
        expect(screen.getByRole('button', { name: 'Скрыть' })).toBeInTheDocument();
    });

    it('кнопка имеет aria-expanded=true после раскрытия', async () => {
        const user = userEvent.setup({ delay: null });
        renderExpandable();
        await user.click(screen.getByRole('button'));
        expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    });

    it('повторный клик свёртывает: aria-expanded возвращается в false', async () => {
        const user = userEvent.setup({ delay: null });
        renderExpandable();
        await user.click(screen.getByRole('button'));
        await user.click(screen.getByRole('button'));
        // AnimatePresence может держать элемент в DOM во время exit-анимации —
        // проверяем состояние через aria, а не DOM-присутствие
        expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('button', { name: 'Показать больше' })).toBeInTheDocument();
    });

    it('не рендерит кнопку если нет скрытого контента', () => {
        render(
            <ExpandableContent>
                <p>Единственный абзац</p>
            </ExpandableContent>
        );
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
