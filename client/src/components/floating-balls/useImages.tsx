import { useMemo } from 'react';

export function useImages(srcs: string[]): HTMLImageElement[] {
    return useMemo(
        () =>
            srcs.map((src) => {
                const img = new Image();
                img.src = src;
                return img;
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [srcs.join(',')]
    );
}
