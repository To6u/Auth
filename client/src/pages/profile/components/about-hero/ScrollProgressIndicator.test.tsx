import { render } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { ScrollProgressIndicator } from './ScrollProgressIndicator';

// Обёртка: передаём containerRef в компонент
function WithRef({ height = 0 }: { height?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    return (
        <div
            ref={ref}
            style={{ height }}
            data-testid="container"
        >
            <ScrollProgressIndicator containerRef={ref} />
        </div>
    );
}

describe('ScrollProgressIndicator', () => {
    it('возвращает null в jsdom (getBoundingClientRect возвращает нулевые размеры)', () => {
        // В jsdom нет реального layout — getBoundingClientRect().height всегда 0.
        // Компонент возвращает null при svgHeight===0.
        const { container } = render(<WithRef />);
        expect(container.querySelector('.scroll-progress-indicator')).toBeNull();
    });

    it('не крашится с пустым containerRef', () => {
        // Smoke: монтируется без ошибок
        expect(() => render(<WithRef />)).not.toThrow();
    });
});
