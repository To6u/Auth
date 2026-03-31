import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

const ThrowingComponent = () => {
    throw new Error('тестовая ошибка');
};

describe('ErrorBoundary', () => {
    it('рендерит children если ошибок нет', () => {
        render(
            <ErrorBoundary fallback={<div>ошибка</div>}>
                <span>контент</span>
            </ErrorBoundary>
        );
        expect(screen.getByText('контент')).toBeInTheDocument();
    });

    it('показывает fallback при ошибке в children', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(
            <ErrorBoundary fallback={<div>fallback ui</div>} name="TestBoundary">
                <ThrowingComponent />
            </ErrorBoundary>
        );

        expect(screen.getByText('fallback ui')).toBeInTheDocument();
        consoleSpy.mockRestore();
    });

    it('рендерит null fallback без DOM-узла (режим canvas)', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = render(
            <ErrorBoundary fallback={null}>
                <ThrowingComponent />
            </ErrorBoundary>
        );
        expect(container.firstChild).toBeNull();
        consoleSpy.mockRestore();
    });
});
