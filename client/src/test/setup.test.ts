import { describe, expect, it } from 'vitest';

describe('Test setup', () => {
    it('WebGL context mock доступен на canvas', () => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        expect(gl).not.toBeNull();
        expect(typeof gl!.clear).toBe('function');
        expect(typeof gl!.drawArrays).toBe('function');
    });

    it('ResizeObserver замокан', () => {
        expect(typeof ResizeObserver).toBe('function');
        const ro = new ResizeObserver(() => {});
        expect(typeof ro.observe).toBe('function');
        expect(typeof ro.disconnect).toBe('function');
    });

    it('matchMedia замокан', () => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        expect(typeof mq.matches).toBe('boolean');
        expect(typeof mq.addEventListener).toBe('function');
    });
});
