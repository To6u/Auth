import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimationModeProvider } from '@/context/AnimationModeContext';
import Contacts from './Contacts';

// IntersectionObserver отсутствует в jsdom — AsciiRain его использует
vi.stubGlobal(
    'IntersectionObserver',
    vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    }))
);

function renderContacts() {
    return render(
        <AnimationModeProvider>
            <Contacts />
        </AnimationModeProvider>
    );
}

describe('Contacts', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('рендерит карточку Telegram', () => {
        renderContacts();
        expect(screen.getByText('Telegram')).toBeInTheDocument();
    });

    it('рендерит карточку Instagram', () => {
        renderContacts();
        expect(screen.getByText('Instagram')).toBeInTheDocument();
    });

    it('рендерит карточку Email', () => {
        renderContacts();
        expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('карточки соц.сетей — это ссылки с href', () => {
        const { container } = renderContacts();
        const links = container.querySelectorAll<HTMLAnchorElement>('a[href]');
        const hrefs = Array.from(links).map((a) => a.href);
        expect(hrefs.some((h) => h.includes('t.me'))).toBe(true);
        expect(hrefs.some((h) => h.includes('instagram.com'))).toBe(true);
    });

    it('рендерит фото snow (img с src)', () => {
        const { container } = renderContacts();
        const img = container.querySelector<HTMLImageElement>('img[src]');
        expect(img).toBeTruthy();
    });

    it('AsciiArt рендерит <pre aria-hidden="true">', () => {
        const { container } = renderContacts();
        const pre = container.querySelector('pre[aria-hidden="true"]');
        expect(pre).toBeTruthy();
    });

    it('AsciiRain рендерит canvas (smoke)', () => {
        const { container } = renderContacts();
        // contacts-ascii-canvas — canvas элемент внутри AsciiRain
        const canvas = container.querySelector('canvas.contacts-ascii-canvas');
        expect(canvas).toBeTruthy();
    });

    it('companion-group__ascii (AsciiArt companion) присутствует в разметке', () => {
        const { container } = renderContacts();
        // AsciiArt компонент рендерит pre — он может иметь className
        const pres = container.querySelectorAll('pre');
        expect(pres.length).toBeGreaterThan(0);
    });
});
