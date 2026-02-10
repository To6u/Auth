import { memo, useRef, useCallback } from 'react';
import { motion, MotionValue, useTransform, useSpring, useMotionValue } from 'framer-motion';
import './card-gallery.css';

interface CardGalleryProps {
    images: string[];
    /** margin-left в стопке (до 70%) */
    stackMargin?: number;
    /** Scroll progress для появления (0-1) */
    enterProgress?: MotionValue<number>;
    /** Scroll progress для ухода (0-1) */
    exitProgress?: MotionValue<number>;
}

interface CardProps {
    src: string;
    index: number;
    totalCards: number;
    stackMargin: number;
    enterProgress?: MotionValue<number>;
    exitProgress?: MotionValue<number>;
    onClick: () => void;
}

// Вычисляем финальные значения для каждой карточки
const getCardStyles = (index: number) => {
    // rotateY: первая -180, остальные -124
    const rotateY = index === 0 ? -180 : -124;

    // scale: 1.1, 1.0, 0.9, 0.8, 0.7...
    const scale = 1.1 - index * 0.1;

    // marginLeft (финальный):
    // 0: -24px
    // 1: -3px
    // 2+: -24 - ((index - 1) * 20) → -44, -64, -84...
    let spreadMargin: number;
    if (index === 0) {
        spreadMargin = -24;
    } else if (index === 1) {
        spreadMargin = 15;
    } else {
        spreadMargin = -10 - (index - 1) * 20;
    }

    return { rotateY, scale, spreadMargin };
};

const springConfig = { stiffness: 300, damping: 20 };

const Card = memo(({ src, index, totalCards, stackMargin, enterProgress, exitProgress, onClick }: CardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);

    // Motion values для tilt
    const tiltX = useMotionValue(0);
    const tiltY = useMotionValue(0);
    const glareX = useMotionValue(50);
    const glareY = useMotionValue(50);
    const glareOpacity = useMotionValue(0);

    // Spring анимации для плавности
    const springRotateX = useSpring(tiltX, springConfig);
    const springRotateY = useSpring(tiltY, springConfig);
    const springGlareOpacity = useSpring(glareOpacity, springConfig);

    const centerIndex = (totalCards - 1) / 2;
    const offsetFromCenter = index - centerIndex;

    const { rotateY: baseRotateY, scale, spreadMargin } = getCardStyles(index);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const card = cardRef.current;
            if (!card) return;

            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const x = (e.clientX - centerX) / (rect.width / 2);
            const y = (e.clientY - centerY) / (rect.height / 2);

            // Угол уменьшается с индексом: первая 20°, последняя ~3°
            const maxAngle = 20 - (index / (totalCards - 1)) * 17;

            tiltY.set(x * maxAngle);
            tiltX.set(-y * maxAngle);
            glareX.set(((e.clientX - rect.left) / rect.width) * 100);
            glareY.set(((e.clientY - rect.top) / rect.height) * 100);
            glareOpacity.set(0.15 + Math.abs(x * y) * 0.1);
        },
        [tiltX, tiltY, glareX, glareY, glareOpacity, index, totalCards]
    );

    const handleMouseLeave = useCallback(() => {
        tiltX.set(0);
        tiltY.set(0);
        glareOpacity.set(0);
    }, [tiltX, tiltY, glareOpacity]);

    // Enter: до 70% — статично (stackMargin, scale 1), 70-100% — раскрытие
    const enterMarginLeft = useTransform(
        enterProgress ?? ({ get: () => 1 } as MotionValue<number>),
        [0, 0.7, 1],
        [stackMargin, stackMargin, spreadMargin]
    );

    const enterScale = useTransform(
        enterProgress ?? ({ get: () => 1 } as MotionValue<number>),
        [0, 0.7, 1],
        [1, 1, scale]
    );

    // Exit: 0-30% — сворачивание обратно
    const exitMarginLeft = useTransform(
        exitProgress ?? ({ get: () => 0 } as MotionValue<number>),
        [0, 0.3, 1],
        [spreadMargin, stackMargin, stackMargin]
    );

    const exitScale = useTransform(
        exitProgress ?? ({ get: () => 0 } as MotionValue<number>),
        [0, 0.3, 1],
        [scale, 1, 1]
    );

    // Комбинируем enter и exit
    const marginLeft = useTransform(() => {
        const exitProg = exitProgress?.get() ?? 0;
        return exitProg > 0.01 ? exitMarginLeft.get() : enterMarginLeft.get();
    });

    const scaleValue = useTransform(() => {
        const exitProg = exitProgress?.get() ?? 0;
        return exitProg > 0.01 ? exitScale.get() : enterScale.get();
    });

    // Комбинируем базовый rotateY с tilt
    const combinedRotateY = useTransform(springRotateY, (tiltYValue) => baseRotateY + tiltYValue);

    // Glare background
    const glareBackground = useTransform(
        [glareX, glareY],
        ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`
    );

    return (
        <motion.div
            ref={cardRef}
            className="card-gallery__card"
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateY: combinedRotateY,
                rotateX: springRotateX,
                marginLeft,
                scale: scaleValue,
                zIndex: totalCards - Math.abs(Math.round(offsetFromCenter)),
            }}
        >
            <div
                className="card-gallery__card-hitbox"
                style={{ transform: `rotateY(${-baseRotateY}deg)` }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            />
            <div className="card-gallery__card-inner">
                <img src={src} alt="" loading="lazy" draggable={false} />
                {/* Glare эффект */}
                <motion.div
                    className="card-gallery__card-glare"
                    style={{
                        opacity: springGlareOpacity,
                        background: glareBackground,
                    }}
                />
            </div>
        </motion.div>
    );
});

Card.displayName = 'Card';

export const CardGallery = memo(({ images, stackMargin = -114, enterProgress, exitProgress }: CardGalleryProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    const openModal = useCallback((src: string) => {
        const dialog = dialogRef.current;
        if (dialog) {
            const img = dialog.querySelector('img');
            if (img) img.src = src;
            dialog.showModal();
        }
    }, []);

    const closeModal = useCallback(() => {
        dialogRef.current?.close();
    }, []);

    // ═══════════════════════════════════════════════════════════════
    // Контейнер едет справа (0% → 70%), потом статичен
    // ═══════════════════════════════════════════════════════════════

    const enterTranslateX = useTransform(
        enterProgress ?? ({ get: () => 1 } as MotionValue<number>),
        [0, 0.6, 1],
        ['100%', '40%', '0%']
    );

    const exitTranslateX = useTransform(
        exitProgress ?? ({ get: () => 0 } as MotionValue<number>),
        [0, 0.4, 1],
        ['0%', '10%', '100%']
    );

    const translateX = useTransform(() => {
        const exitProg = exitProgress?.get() ?? 0;
        return exitProg > 0.01 ? exitTranslateX.get() : enterTranslateX.get();
    });

    // ═══════════════════════════════════════════════════════════════
    // OPACITY
    // ═══════════════════════════════════════════════════════════════

    const enterOpacity = useTransform(
        enterProgress ?? ({ get: () => 1 } as MotionValue<number>),
        [0, 0.4, 0.6, 1],
        [0, 0, 0.5, 1]
    );

    const exitOpacity = useTransform(
        exitProgress ?? ({ get: () => 0 } as MotionValue<number>),
        [0, 0.4, 0.6, 1],
        [1, 0.2, 0, 0]
    );

    const opacity = useTransform(() => {
        const exitProg = exitProgress?.get() ?? 0;
        return exitProg > 0.01 ? exitOpacity.get() : enterOpacity.get();
    });

    return (
        <>
            <motion.div className="card-gallery" style={{ opacity }}>
                <motion.div className="card-gallery__container" style={{ x: translateX }}>
                    {images.map((src, i) => (
                        <Card
                            key={`${src}-${i}`}
                            src={src}
                            index={i}
                            totalCards={images.length}
                            stackMargin={stackMargin}
                            enterProgress={enterProgress}
                            exitProgress={exitProgress}
                            onClick={() => openModal(src)}
                        />
                    ))}
                </motion.div>
            </motion.div>

            <dialog
                ref={dialogRef}
                className="card-gallery__dialog"
                onClick={(e) => {
                    if (e.target === dialogRef.current) closeModal();
                }}
            >
                <div className="card-gallery__dialog-content">
                    <img src="" alt="" />
                    <button className="card-gallery__dialog-close" onClick={closeModal} aria-label="Закрыть">
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </dialog>
        </>
    );
});

CardGallery.displayName = 'CardGallery';
