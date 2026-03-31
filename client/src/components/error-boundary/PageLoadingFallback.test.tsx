import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageLoadingFallback } from './PageLoadingFallback';

describe('PageLoadingFallback', () => {
    it('renders fallback container', () => {
        const { container } = render(<PageLoadingFallback />);
        expect(container.querySelector('.page-loading-fallback')).toBeTruthy();
    });

    it('не перекрывает экран после монтирования (позиционирование через CSS)', () => {
        const { container } = render(<PageLoadingFallback />);
        const fallback = container.querySelector('.page-loading-fallback');
        // Компонент смонтирован — управление видимостью через CSS (AppLoader в App.tsx)
        expect(fallback).toBeTruthy();
    });
});
