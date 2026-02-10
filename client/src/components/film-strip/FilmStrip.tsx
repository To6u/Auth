import { useRef, useMemo, useEffect, useState } from 'react';
import { motion, useTransform, useMotionValue, animate, useInView } from 'framer-motion';
import './film-strip.css';

// Центральная линия ленты (упрощённый path для offset-path)
const FILM_PATH =
    'M132.8 1.8 C77 -6 36 46 22 95 C-30 326 13 575 118 785 C122 792 127 799 132 805 C171 850 223 892 286 890 C347 887 398 846 441 805 C506 742 485 640 451 566 C435 537 421 506 425 473 C427 439 460 414 493 415 L718 415 C828 419 924 319 915 209 C925 67 767 -11 643 1 C525 10 408 14 290 10 C238 9 185 6 133 1';

export interface FilmFrame {
    id: string | number;
    image?: string;
    content?: React.ReactNode;
}

interface FilmStripProps {
    frames: FilmFrame[];
    /** Размер кадра в px */
    frameSize?: number;
    /** Расстояние между кадрами (в % от path) */
    frameGap?: number;
    /** Длительность одного цикла в секундах */
    duration?: number;
    /** Ширина SVG */
    width?: number;
    /** Высота SVG */
    height?: number;
    className?: string;
}

export const FilmStrip = ({
    frames,
    frameSize = 80,
    frameGap = 10,
    duration = 20,
    width = 916,
    height = 891,
    className = '',
}: FilmStripProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const baseOffset = useMotionValue(0);
    const [hasAppeared, setHasAppeared] = useState(false);

    // Отслеживаем появление во viewport (5%)
    const isInView = useInView(containerRef, {
        once: false,
        amount: 0.05,
    });

    // Запоминаем что элемент уже появлялся (для анимации)
    useEffect(() => {
        if (isInView && !hasAppeared) {
            setHasAppeared(true);
        }
    }, [isInView, hasAppeared]);

    // Бесконечная анимация (запускается только когда во viewport)
    useEffect(() => {
        if (!isInView) return;

        const controls = animate(baseOffset, -100, {
            duration,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'loop',
        });

        return () => controls.stop();
    }, [baseOffset, duration, isInView]);

    const visibleFrameCount = useMemo(() => Math.ceil(100 / frameGap) + 2, [frameGap]);

    return (
        <motion.div
            ref={containerRef}
            className={`film-strip ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: isInView ? 1 : 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
        >
            <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="film-strip__svg">
                <defs>
                    <linearGradient id="filmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2a2a2a" />
                        <stop offset="50%" stopColor="#1a1a1a" />
                        <stop offset="100%" stopColor="#0f0f0f" />
                    </linearGradient>
                </defs>

                {/* Лента-фон — широкая полоса */}
                <path d={FILM_PATH} className="film-strip__track" />

                {/* Кадры */}
                {Array.from({ length: visibleFrameCount }).map((_, slotIndex) => (
                    <FrameSlot
                        key={slotIndex}
                        frames={frames}
                        slotIndex={slotIndex}
                        size={frameSize}
                        gap={frameGap}
                        baseOffset={baseOffset}
                        path={FILM_PATH}
                    />
                ))}
            </svg>
        </motion.div>
    );
};

interface FrameSlotProps {
    frames: FilmFrame[];
    slotIndex: number;
    size: number;
    gap: number;
    baseOffset: ReturnType<typeof useMotionValue<number>>;
    path: string;
}

const FrameSlot = ({ frames, slotIndex, size, gap, baseOffset, path }: FrameSlotProps) => {
    const offsetDistance = useTransform(baseOffset, (scrollValue) => {
        const rawPosition = scrollValue + slotIndex * gap;
        const cyclicPosition = ((rawPosition % 100) + 100) % 100;
        return `${cyclicPosition}%`;
    });

    const frameIndex = useTransform(baseOffset, (scrollValue) => {
        const rawPosition = scrollValue + slotIndex * gap;
        const cycles = Math.floor(rawPosition / 100);
        return (((slotIndex - cycles) % frames.length) + frames.length) % frames.length;
    });

    const opacity = useTransform(baseOffset, (scrollValue) => {
        const rawPosition = scrollValue + slotIndex * gap;
        const cyclicPosition = ((rawPosition % 100) + 100) % 100;
        if (cyclicPosition < 5) return cyclicPosition / 5;
        if (cyclicPosition > 95) return (100 - cyclicPosition) / 5;
        return 1;
    });

    return (
        <motion.g
            style={{
                offsetPath: `path('${path}')`,
                offsetDistance,
                offsetRotate: 'auto 180deg',
            }}
        >
            <motion.foreignObject x={-size / 2} y={-size / 2} width={size} height={size} style={{ opacity }}>
                <FrameContent frames={frames} frameIndex={frameIndex} size={size} />
            </motion.foreignObject>
        </motion.g>
    );
};

interface FrameContentProps {
    frames: FilmFrame[];
    frameIndex: ReturnType<typeof useTransform<number, number>>;
    size: number;
}

const FrameContent = ({ frames, frameIndex, size }: FrameContentProps) => {
    const index = useTransform(frameIndex, (i) => Math.round(i));

    return (
        <motion.div className="film-strip__frame" style={{ width: size, height: size }}>
            <div className="film-strip__frame-border" />
            <div className="film-strip__frame-inner">
                {frames.map((frame, i) => (
                    <FrameImage key={frame.id} frame={frame} isVisible={index} index={i} />
                ))}
            </div>
            <div className="film-strip__frame-shine" />
        </motion.div>
    );
};

interface FrameImageProps {
    frame: FilmFrame;
    isVisible: ReturnType<typeof useTransform<number, number>>;
    index: number;
}

const FrameImage = ({ frame, isVisible, index }: FrameImageProps) => {
    const opacity = useTransform(isVisible, (visibleIndex) => (visibleIndex === index ? 1 : 0));

    const display = useTransform(isVisible, (visibleIndex) => (visibleIndex === index ? 'block' : 'none'));

    return (
        <motion.div className="film-strip__frame-wrapper" style={{ opacity, display }}>
            {frame.image ? (
                <img src={frame.image} alt="" className="film-strip__frame-image" />
            ) : (
                frame.content || <div className="film-strip__frame-placeholder" />
            )}
        </motion.div>
    );
};

export default FilmStrip;
