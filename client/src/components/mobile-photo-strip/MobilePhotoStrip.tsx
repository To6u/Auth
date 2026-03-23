import type React from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './mobile-photo-strip.css';

// Seed-based pseudo-random для стабильных форм между рендерами
function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function generateBlobRadius(index: number): string {
    const rand = seededRandom(index * 137 + 42);
    // 8 значений: 4 горизонтальных / 4 вертикальных
    // Диапазон 30%–70% даёт органичные формы без экстрима
    const values = Array.from({ length: 8 }, () => Math.round(30 + rand() * 40));
    return `${values[0]}% ${values[1]}% ${values[2]}% ${values[3]}% / ${values[4]}% ${values[5]}% ${values[6]}% ${values[7]}%`;
}

// Pre-generate для всех фото
const BLOB_RADII: string[] = Array.from({ length: 20 }, (_, i) => generateBlobRadius(i));

interface Props {
    images: string[];
    altImages?: string[][];
    className?: string;
}

const IMAGE_SWITCH_INTERVAL_MS = 250;
// 80px * scale(2.5) = 200px visual height → 50% = 100px scroll drift
const AUTO_CLOSE_SCROLL_THRESHOLD = 100;

interface Selection {
    index: number;
    originalIndex: number;
    transform: string;
    scrollY: number;
}

interface AltState {
    current: number;
    prev: number;
}

const MobilePhotoStrip = ({ images, altImages, className }: Props) => {
    const [selection, setSelection] = useState<Selection | null>(null);
    const [altState, setAltState] = useState<AltState>({ current: 0, prev: 0 });
    const navClickedRef = useRef(false);
    // Направление последней навигации между фото (null = auto-cycle, использует fade)
    const slideDirRef = useRef<'left' | 'right' | null>(null);
    // Ref для handlePhotoClick — избегаем stale closure через [selection] dep
    const selectionRef = useRef<Selection | null>(null);
    selectionRef.current = selection;

    const rowLeft = images.filter((_, i) => i % 2 === 0);
    const rowRight = images.filter((_, i) => i % 2 !== 0);

    // Оригинальные индексы в images для каждого ряда
    const rowLeftOriginalIndices = images.map((_, i) => i).filter((i) => i % 2 === 0);
    const rowRightOriginalIndices = images.map((_, i) => i).filter((i) => i % 2 !== 0);

    const handlePhotoClick = useCallback(
        (e: React.MouseEvent, globalIndex: number, originalIndex: number) => {
            e.stopPropagation();

            if (selectionRef.current?.index === globalIndex) {
                setSelection(null);
                return;
            }

            const target = e.currentTarget as HTMLElement;
            const rect = target.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = window.innerWidth / 2 - cx;
            const dy = window.innerHeight / 2 - cy;

            setSelection({
                index: globalIndex,
                originalIndex,
                transform: `translate(${dx}px, ${dy}px) scale(2.5)`,
                scrollY: window.scrollY,
            });
        },
        [] // selectionRef стабилен — stale closure устранена
    );

    // Предзагрузка alt-вариантов при выборе фото — без этого первый переход даёт дёргание.
    // Здесь же сбрасываем slideDir: он нужен только для одного рендера после nav,
    // дальнейшие auto-cycle переходы должны использовать fade.
    useEffect(() => {
        slideDirRef.current = null;
        if (selection === null) return;
        const alts = altImages?.[selection.originalIndex] ?? [];
        alts.forEach((src) => {
            const img = new window.Image();
            img.src = src;
        });
    }, [selection?.originalIndex, altImages]);

    // Авто-цикл alt-вариантов при смене/закрытии выбранного фото
    useEffect(() => {
        if (selection === null) {
            setAltState({ current: 0, prev: 0 });
            return;
        }

        const alts = altImages?.[selection.originalIndex] ?? [];
        if (alts.length === 0) return;

        const total = 1 + alts.length;
        const id = setInterval(() => {
            setAltState((s) => {
                if (s.current >= total - 1) return s;
                return { current: s.current + 1, prev: s.current };
            });
        }, IMAGE_SWITCH_INTERVAL_MS);
        return () => clearInterval(id);
    }, [selection?.index, selection?.originalIndex, altImages]);

    // Авто-закрытие если фото ушло за 50% экрана при скролле
    useEffect(() => {
        if (selection === null) return;
        const baseScrollY = selection.scrollY;
        const onScroll = () => {
            if (Math.abs(window.scrollY - baseScrollY) > AUTO_CLOSE_SCROLL_THRESHOLD) {
                setSelection(null);
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [selection?.index]);

    // Бесконечная карусель между фотографиями (my1 → my2 → my3 → my1 → …)
    const handlePhotoNav = useCallback(
        (dir: -1 | 1) => {
            navClickedRef.current = true;
            requestAnimationFrame(() => {
                navClickedRef.current = false;
            });
            // Направление для CSS-анимации слайда
            slideDirRef.current = dir === 1 ? 'right' : 'left';
            // Сбрасываем altState синхронно — батчится с setSelection в один рендер
            setAltState({ current: 0, prev: 0 });
            setSelection((s) => {
                if (!s) return null;
                const next = (s.originalIndex + dir + images.length) % images.length;
                return { ...s, originalIndex: next };
            });
        },
        [images.length]
    );

    useEffect(() => {
        if (selection === null) return;

        const handleOutsideClick = (e: MouseEvent) => {
            if (navClickedRef.current) return;
            const target = e.target as HTMLElement;
            if (target.closest('.mobile-photo-strip__photo')) return;
            if (target.closest('.mobile-photo-strip__photo-nav')) return;
            setSelection(null);
        };

        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [selection]);

    // globalIndex < 1000 → ряд 0, >= 1000 → ряд 1
    const selectedRowIndex = selection !== null ? (selection.index < 1000 ? 0 : 1) : null;

    // Бесконечная карусель — стрелки видны всегда при 2+ фото
    const showNav = selection !== null && images.length > 1;
    const slideDir = slideDirRef.current;

    return (
        <div
            className={`mobile-photo-strip${className ? ` ${className}` : ''}${selection !== null ? ' mobile-photo-strip--active' : ''}`}
        >
            {selection !== null && <div className="mobile-photo-strip__overlay" />}
            <PhotoRow
                photos={rowLeft}
                originalIndices={rowLeftOriginalIndices}
                images={images}
                altImages={altImages}
                direction="left"
                rowIndex={0}
                selection={selection}
                altState={altState}
                slideDir={slideDir}
                hasSelected={selectedRowIndex === 0}
                onPhotoClick={handlePhotoClick}
            />
            <PhotoRow
                photos={rowRight}
                originalIndices={rowRightOriginalIndices}
                images={images}
                altImages={altImages}
                direction="right"
                rowIndex={1}
                selection={selection}
                altState={altState}
                slideDir={slideDir}
                hasSelected={selectedRowIndex === 1}
                onPhotoClick={handlePhotoClick}
            />
            {showNav &&
                createPortal(
                    <button
                        className="mobile-photo-strip__photo-nav mobile-photo-strip__photo-nav--prev"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            handlePhotoNav(-1);
                        }}
                        aria-label="Предыдущее фото"
                    >
                        ‹
                    </button>,
                    document.body
                )}
            {showNav &&
                createPortal(
                    <button
                        className="mobile-photo-strip__photo-nav mobile-photo-strip__photo-nav--next"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            handlePhotoNav(1);
                        }}
                        aria-label="Следующее фото"
                    >
                        ›
                    </button>,
                    document.body
                )}
        </div>
    );
};

interface PhotoRowProps {
    photos: string[];
    originalIndices: number[];
    images: string[];
    altImages?: string[][];
    direction: 'left' | 'right';
    rowIndex: number;
    selection: Selection | null;
    altState: AltState;
    slideDir: 'left' | 'right' | null;
    hasSelected: boolean;
    onPhotoClick: (e: React.MouseEvent, globalIndex: number, originalIndex: number) => void;
}

const PhotoRow = memo(
    ({
        photos,
        originalIndices,
        images,
        altImages,
        direction,
        rowIndex,
        selection,
        altState,
        slideDir,
        hasSelected,
        onPhotoClick,
    }: PhotoRowProps) => {
        const doubled = [...photos, ...photos];

        const rowCls = [
            'mobile-photo-strip__row',
            `mobile-photo-strip__row--${direction}`,
            selection !== null ? 'mobile-photo-strip__row--paused' : '',
            hasSelected ? 'mobile-photo-strip__row--has-selected' : '',
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={rowCls}>
                {doubled.map((src, i) => {
                    const isDuplicate = i >= photos.length;
                    const posInRow = i % photos.length;
                    const globalIndex = rowIndex * 1000 + posInRow + (isDuplicate ? 500 : 0);
                    const originalIndex = originalIndices[posInRow];
                    const isSelected = selection?.index === globalIndex;
                    const isDimmed = selection !== null && !isSelected;
                    const borderRadius = BLOB_RADII[originalIndex % BLOB_RADII.length];

                    if (isSelected && selection) {
                        const navOrigIdx = selection.originalIndex;
                        const navBaseSrc = images[navOrigIdx] ?? src;
                        const alts = altImages?.[navOrigIdx] ?? [];
                        const getSrc = (idx: number): string =>
                            idx === 0 ? navBaseSrc : (alts[idx - 1] ?? navBaseSrc);
                        const currentSrc = getSrc(altState.current);
                        const prevSrc = getSrc(altState.prev);

                        return (
                            <div
                                key={`${rowIndex}-${i}`}
                                className="mobile-photo-strip__photo mobile-photo-strip__photo--selected mobile-photo-strip__photo-layers"
                                style={{ transform: selection.transform, borderRadius }}
                                onClick={(e) => onPhotoClick(e, globalIndex, originalIndex)}
                            >
                                <img
                                    src={prevSrc}
                                    className="mobile-photo-strip__photo-layer"
                                    draggable={false}
                                    alt=""
                                />
                                <img
                                    key={currentSrc}
                                    src={currentSrc}
                                    className={`mobile-photo-strip__photo-layer mobile-photo-strip__photo-layer--top${slideDir ? `--slide-${slideDir}` : ''}`}
                                    draggable={false}
                                    alt=""
                                />
                            </div>
                        );
                    }

                    const imgCls = [
                        'mobile-photo-strip__photo',
                        isDimmed ? 'mobile-photo-strip__photo--dimmed' : '',
                    ]
                        .filter(Boolean)
                        .join(' ');

                    return (
                        <img
                            key={`${rowIndex}-${i}`}
                            src={src}
                            className={imgCls}
                            draggable={false}
                            style={{ borderRadius }}
                            onClick={(e) => onPhotoClick(e, globalIndex, originalIndex)}
                            alt=""
                        />
                    );
                })}
            </div>
        );
    }
);

PhotoRow.displayName = 'PhotoRow';

export default MobilePhotoStrip;
