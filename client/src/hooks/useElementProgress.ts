import { type MotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';

const resolvePoint = (point: string, size: number): number => {
    if (point === 'start') return 0;
    if (point === 'end') return size;
    if (point === 'center') return size * 0.5;
    if (point.endsWith('%')) return (size * parseFloat(point)) / 100;
    return 0;
};

/**
 * Вычисляет позицию скролла (px) для заданного offset-выражения.
 * Формат: "elementPoint viewportPoint" (аналог Framer Motion offset).
 * Возвращает значение scrollY при котором данный offset активируется.
 */
const parseScrollAt = (
    offsetStr: string,
    elTop: number,
    elHeight: number,
    vpHeight: number
): number => {
    const [elPart, vpPart] = offsetStr.trim().split(/\s+/);
    const elPoint = resolvePoint(elPart, elHeight);
    const vpPoint = resolvePoint(vpPart ?? 'start', vpHeight);
    return elTop + elPoint - vpPoint;
};

/**
 * Аналог useScroll({ target, offset }), но без DOM-ридов в RAF hot path.
 *
 * Измеряет элемент один раз при маунте/ресайзе, кэширует пиксельный
 * диапазон в ref, и возвращает MotionValue<number> [0→1] через useTransform.
 *
 * @param ref     — ref на DOM-элемент (аналог target)
 * @param offsets — [startOffset, endOffset] в формате "elementPoint viewportPoint"
 * @param scrollY — абсолютный scrollY (из useScroll())
 */
export const useElementProgress = <T extends Element>(
    ref: { readonly current: T | null },
    offsets: [string, string],
    scrollY: MotionValue<number>
): MotionValue<number> => {
    const rangeRef = useRef<[number, number]>([0, 1]);
    const offsetsRef = useRef(offsets);
    offsetsRef.current = offsets;

    useEffect(() => {
        const measure = () => {
            const el = ref.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const elTop = rect.top + window.scrollY;
            const elHeight = rect.height;
            const vpHeight = window.innerHeight;
            const [off0, off1] = offsetsRef.current;
            rangeRef.current = [
                parseScrollAt(off0, elTop, elHeight, vpHeight),
                parseScrollAt(off1, elTop, elHeight, vpHeight),
            ];
        };

        measure();

        const ro = new ResizeObserver(measure);
        ro.observe(document.body);
        return () => ro.disconnect();
    }, [ref]);

    return useTransform(() => {
        const [start, end] = rangeRef.current;
        const y = scrollY.get();
        if (start === end) return 0;
        return Math.max(0, Math.min(1, (y - start) / (end - start)));
    });
};
