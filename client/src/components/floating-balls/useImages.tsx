import { useEffect, useMemo, useRef } from 'react';

function isGif(src: string): boolean {
    return src.toLowerCase().includes('.gif');
}

function createHiddenContainer(): HTMLDivElement {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none';
    return el;
}

export function useImages(srcs: string[]): HTMLImageElement[] {
    const containerRef = useRef<HTMLDivElement | null>(null);

    if (!containerRef.current) {
        containerRef.current = createHiddenContainer();
        document.body.appendChild(containerRef.current);
    }

    const images = useMemo(
        () =>
            srcs.map((src) => {
                const img = new Image();
                img.src = src;
                if (isGif(src)) {
                    containerRef.current?.appendChild(img);
                }
                return img;
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [srcs.join(',')]
    );

    useEffect(() => {
        return () => {
            containerRef.current?.remove();
            containerRef.current = null;
        };
    }, []);

    return images;
}

export function useImageSets(sets: string[][]): HTMLImageElement[][] {
    const containerRef = useRef<HTMLDivElement | null>(null);

    if (!containerRef.current) {
        containerRef.current = createHiddenContainer();
        document.body.appendChild(containerRef.current);
    }

    const imageSets = useMemo(
        () =>
            sets.map((srcs) =>
                srcs.map((src) => {
                    const img = new Image();
                    img.src = src;
                    if (isGif(src)) {
                        containerRef.current?.appendChild(img);
                    }
                    return img;
                })
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [sets.map((s) => s.join(',')).join('|')]
    );

    useEffect(() => {
        return () => {
            containerRef.current?.remove();
            containerRef.current = null;
        };
    }, []);

    return imageSets;
}
