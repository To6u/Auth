import { useCallback, useEffect, useState } from 'react';
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
    className?: string;
}

interface Selection {
    index: number;
    transform: string;
}

const MobilePhotoStrip = ({ images, className }: Props) => {
    const [selection, setSelection] = useState<Selection | null>(null);

    const rowLeft = images.filter((_, i) => i % 2 === 0);
    const rowRight = images.filter((_, i) => i % 2 !== 0);

    // Оригинальные индексы в images для каждого ряда
    const rowLeftOriginalIndices = images.map((_, i) => i).filter((i) => i % 2 === 0);
    const rowRightOriginalIndices = images.map((_, i) => i).filter((i) => i % 2 !== 0);

    const handlePhotoClick = useCallback(
        (e: React.MouseEvent<HTMLImageElement>, globalIndex: number) => {
            e.stopPropagation();

            if (selection?.index === globalIndex) {
                setSelection(null);
                return;
            }

            const rect = e.currentTarget.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = window.innerWidth / 2 - cx;
            const dy = window.innerHeight / 2 - cy;

            setSelection({
                index: globalIndex,
                transform: `translate(${dx}px, ${dy}px) scale(2.5)`,
            });
        },
        [selection]
    );

    useEffect(() => {
        if (selection === null) return;

        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.mobile-photo-strip__photo')) return;
            setSelection(null);
        };

        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [selection]);

    // globalIndex < 1000 → ряд 0, >= 1000 → ряд 1
    const selectedRowIndex = selection !== null ? (selection.index < 1000 ? 0 : 1) : null;

    return (
        <div
            className={`mobile-photo-strip${className ? ` ${className}` : ''}${selection !== null ? ' mobile-photo-strip--active' : ''}`}
        >
            {selection !== null && <div className="mobile-photo-strip__overlay" />}
            <PhotoRow
                photos={rowLeft}
                originalIndices={rowLeftOriginalIndices}
                direction="left"
                rowIndex={0}
                selection={selection}
                hasSelected={selectedRowIndex === 0}
                onPhotoClick={handlePhotoClick}
            />
            <PhotoRow
                photos={rowRight}
                originalIndices={rowRightOriginalIndices}
                direction="right"
                rowIndex={1}
                selection={selection}
                hasSelected={selectedRowIndex === 1}
                onPhotoClick={handlePhotoClick}
            />
        </div>
    );
};

interface PhotoRowProps {
    photos: string[];
    originalIndices: number[];
    direction: 'left' | 'right';
    rowIndex: number;
    selection: Selection | null;
    hasSelected: boolean;
    onPhotoClick: (e: React.MouseEvent<HTMLImageElement>, id: number) => void;
}

const PhotoRow = ({
    photos,
    originalIndices,
    direction,
    rowIndex,
    selection,
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

                const imgCls = [
                    'mobile-photo-strip__photo',
                    isSelected ? 'mobile-photo-strip__photo--selected' : '',
                    isDimmed ? 'mobile-photo-strip__photo--dimmed' : '',
                ]
                    .filter(Boolean)
                    .join(' ');

                const borderRadius = BLOB_RADII[originalIndex % BLOB_RADII.length];

                return (
                    <img
                        key={`${rowIndex}-${i}`}
                        src={src}
                        className={imgCls}
                        draggable={false}
                        style={
                            isSelected
                                ? { transform: selection.transform, borderRadius }
                                : { borderRadius }
                        }
                        onClick={(e) => onPhotoClick(e, globalIndex)}
                    />
                );
            })}
        </div>
    );
};

export default MobilePhotoStrip;
