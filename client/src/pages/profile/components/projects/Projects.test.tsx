import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Projects } from './Projects';
import { PROJECTS } from './projects.data';

describe('Projects', () => {
    beforeEach(() => {
        // RAF не запускается в jsdom — предотвращаем scroll-driven обновление activeIndexRef,
        // чтобы клик по первой карточке (i===activeIndexRef.current===0) работал детерминированно
        vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0));
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
        // IntersectionObserver отсутствует в jsdom
        vi.stubGlobal(
            'IntersectionObserver',
            vi.fn().mockImplementation(() => ({
                observe: vi.fn(),
                unobserve: vi.fn(),
                disconnect: vi.fn(),
            }))
        );
        vi.stubGlobal('scrollTo', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('рендерит секцию #projects', () => {
        const { container } = render(<Projects />);
        expect(container.querySelector('#projects')).toBeTruthy();
    });

    it('рендерит карточку для каждого проекта', () => {
        render(<Projects />);
        for (const p of PROJECTS) {
            expect(screen.getByText(p.title)).toBeInTheDocument();
        }
    });

    it('ни одна карточка не раскрыта по умолчанию', () => {
        const { container } = render(<Projects />);
        expect(container.querySelector('.projects-scene__card--expanded')).toBeNull();
    });

    it('клик по активной карточке (index 0) раскрывает её', async () => {
        const user = userEvent.setup({ delay: null });
        const { container } = render(<Projects />);
        const cards = container.querySelectorAll<HTMLElement>('[role="button"]');
        await user.click(cards[0]);
        expect(container.querySelector('.projects-scene__card--expanded')).toBeTruthy();
    });

    it('кнопка закрыть сворачивает раскрытую карточку', async () => {
        const user = userEvent.setup({ delay: null });
        const { container } = render(<Projects />);
        const cards = container.querySelectorAll<HTMLElement>('[role="button"]');
        await user.click(cards[0]);
        const closeBtn = container.querySelector<HTMLButtonElement>(
            '.projects-scene__close-btn button'
        );
        await user.click(closeBtn!);
        expect(container.querySelector('.projects-scene__card--expanded')).toBeNull();
    });

    it('повторный клик по раскрытой карточке закрывает её', async () => {
        const user = userEvent.setup({ delay: null });
        const { container } = render(<Projects />);
        const cards = container.querySelectorAll<HTMLElement>('[role="button"]');
        await user.click(cards[0]);
        await user.click(cards[0]);
        expect(container.querySelector('.projects-scene__card--expanded')).toBeNull();
    });

    it('рендерит навигационные точки для каждого проекта', () => {
        const { container } = render(<Projects />);
        const dots = container.querySelectorAll('.projects-scene__nav-dot');
        expect(dots).toHaveLength(PROJECTS.length);
    });

    it('счётчик показывает начальное значение "01"', () => {
        const { container } = render(<Projects />);
        const counter = container.querySelector('.projects-scene__counter');
        expect(counter?.textContent).toContain('01');
    });

    it('карточки содержат статус-бейдж', () => {
        const { container } = render(<Projects />);
        const badges = container.querySelectorAll('.projects-scene__badge');
        expect(badges.length).toBeGreaterThan(0);
    });
});
