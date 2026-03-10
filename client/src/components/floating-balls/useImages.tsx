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
    const srcsKey = srcs.join(',');

    const images = useMemo(
        () =>
            srcs.map((src) => {
                const img = new Image();
                img.src = src;
                return img;
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [srcsKey]
    );

    useEffect(() => {
        const container = createHiddenContainer();
        document.body.appendChild(container);

        images.forEach((img, i) => {
            if (isGif(srcs[i] ?? '')) {
                container.appendChild(img);
            }
        });

        return () => {
            container.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [images]);

    return images;
}

export function useImageSets(sets: string[][]): HTMLImageElement[][] {
    const setsKey = sets.map((s) => s.join(',')).join('|');

    const imageSets = useMemo(
        () =>
            sets.map((srcs) =>
                srcs.map((src) => {
                    const img = new Image();
                    img.src = src;
                    return img;
                })
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [setsKey]
    );

    useEffect(() => {
        const container = createHiddenContainer();
        document.body.appendChild(container);

        sets.forEach((srcs, si) => {
            srcs.forEach((src, ii) => {
                if (isGif(src)) {
                    const img = imageSets[si]?.[ii];
                    if (img) container.appendChild(img);
                }
            });
        });

        return () => {
            container.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageSets]);

    return imageSets;
}
