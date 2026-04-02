import { motion, useScroll, useTransform } from 'framer-motion';
import { memo, useEffect, useRef } from 'react';
import FloatingBalls from '@/components/floating-balls/FloatingBalls';
import { MobilePhotoStrip } from '@/components/mobile-photo-strip';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useElementProgress } from '@/hooks/useElementProgress';
import { useWaveEffect } from '@/hooks/useWaveEffect';
import { useAnimationMode } from '@/context/AnimationModeContext';
import { NameSection, SectionOneContent, SectionThreeContent } from './components';
import { useScrollSection } from './hooks/useScrollSection';
import './about-hero.css';

// feDisplacementMap с maxScale:90 не имеет GPU-ускорения в Safari → сильный лаг
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const imageModules = import.meta.glob('@/assets/about-images/*.{jpg,jpeg,JPEG,gif,GIF,png}', {
    eager: true,
    query: '?url',
    import: 'default',
});

const variantRegex = /-\d+\.(jpg|JPEG|jpeg)$/i;
const _entries = Object.entries(imageModules) as [string, string][];
const _baseEntries = _entries.filter(([path]) => !variantRegex.test(path));
const _altEntries = _entries.filter(([path]) => variantRegex.test(path));

const _bardaBaseEntries = _baseEntries.filter(([path]) => /\/barda\d/.test(path));
const PHOTOS = _bardaBaseEntries.map(([, url]) => url);
const ALT_PHOTOS: string[][] = _bardaBaseEntries.map(([basePath]) => {
    const stem = basePath.replace(/\.(jpg|JPEG|jpeg)$/i, '');
    return _altEntries
        .filter(([altPath]) => altPath.replace(variantRegex, '') === stem)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, url]) => url);
});

const _myBaseEntries = _baseEntries.filter(([path]) => /\/my\d/.test(path));
const MY_PHOTOS = _myBaseEntries.map(([, url]) => url);
const MY_ALT_PHOTOS: string[][] = _myBaseEntries.map(([basePath]) => {
    const stem = basePath.replace(/\.(jpg|JPEG|jpeg)$/i, '');
    return _altEntries
        .filter(([altPath]) => altPath.replace(variantRegex, '') === stem)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, url]) => url);
});

export const AboutHero = memo(() => {
    const sectionOneRef = useRef<HTMLDivElement>(null);
    const sectionThreeRef = useRef<HTMLDivElement>(null);
    const sectionTitleRef = useRef<HTMLDivElement>(null);

    const { isSavingMode } = useAnimationMode();

    // <480px — мобилка, <768px — граница grid→flex-column
    const { isMobile, isMobileLayout } = useBreakpoints();

    // ═══════════════════════════════════════════════════════════════
    // SCROLL PROGRESS (источники для всех анимаций)
    // ═══════════════════════════════════════════════════════════════

    // Один useScroll для scrollY — передаётся во все useElementProgress
    const { scrollY } = useScroll();

    const sectionOneEnterProgress = useElementProgress(
        sectionOneRef,
        ['40% end', 'start 20%'],
        scrollY
    );
    const sectionOneExitProgress = useElementProgress(
        sectionOneRef,
        ['80% start', 'end start'],
        scrollY
    );
    const sectionThreeEnterProgress = useElementProgress(
        sectionThreeRef,
        ['start end', 'start 20%'],
        scrollY
    );
    const sectionThreeExitProgress = useElementProgress(
        sectionThreeRef,
        ['70% start', 'end start'],
        scrollY
    );

    // Ref для чтения isMobileLayout внутри useTransform (не реактивен, но обновляется перед каждым кадром)
    const isMobileLayoutRef = useRef(isMobileLayout);
    isMobileLayoutRef.current = isMobileLayout;

    // Мобилка: анимация карточки завершается когда центр карточки = центр экрана
    const sectionOneMobileProgress = useElementProgress(
        sectionOneRef,
        ['start end', 'center center'],
        scrollY
    );
    const sectionThreeMobileProgress = useElementProgress(
        sectionThreeRef,
        ['start end', 'start center'],
        scrollY
    );

    // Максимальное окно для --right heading (десктоп): от момента входа секции в верх экрана до полного выхода
    const headingRightEnterProgress = useElementProgress(
        sectionOneRef,
        ['start start', 'end start'],
        scrollY
    );
    // Мобилка: триггер привязан к самому heading — анимация при входе в поле зрения
    const headingRightMobileProgress = useElementProgress(
        sectionTitleRef,
        ['start end', 'center center'],
        scrollY
    );

    // На мобилке используем прогресс с остановкой на центре экрана
    const sectionOneEnterEffective = useTransform(() =>
        isMobileLayoutRef.current ? sectionOneMobileProgress.get() : sectionOneEnterProgress.get()
    );
    const sectionThreeEnterEffective = useTransform(() =>
        isMobileLayoutRef.current
            ? sectionThreeMobileProgress.get()
            : sectionThreeEnterProgress.get()
    );
    const headingRightEffective = useTransform(() =>
        isMobileLayoutRef.current
            ? headingRightMobileProgress.get()
            : headingRightEnterProgress.get()
    );

    // Мобилка: гистерезис — появление [0.6, 1.0], исчезновение [0.3, 0.1] при скролле вверх
    const photoStripVisibleRef = useRef(false);

    const photoStripOpacity = useTransform(() => {
        const p = headingRightEffective.get();

        if (!photoStripVisibleRef.current) {
            if (p < 0.6) return 0;
            if (p >= 0.9) photoStripVisibleRef.current = true;
            // Плавное появление на [0.6, 1.0] — широкий диапазон
            return Math.min(1, (p - 0.6) / 0.4);
        } else {
            if (p >= 0.6) return 1;
            if (p <= 0.1) {
                photoStripVisibleRef.current = false;
                return 0;
            }
            if (p < 0.3) {
                return (p - 0.1) / 0.2;
            }
            return 1;
        }
    });

    const photoStripY = useTransform(() => {
        const opacity = photoStripOpacity.get();
        return (1 - opacity) * 40;
    });

    // Мобилка: исчезновение полосы фото при уходе вверх из viewport
    const photoStripRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: photoStripExitProgress } = useScroll({
        target: photoStripRef,
        offset: ['90% start', 'end start'],
    });
    const photoStripExitOpacity = useTransform(photoStripExitProgress, [0, 1], [1, 0]);
    const photoStripCombinedOpacity = useTransform(
        () => photoStripOpacity.get() * photoStripExitOpacity.get()
    );

    // ═══════════════════════════════════════════════════════════════
    // WAVE EFFECTS
    // ═══════════════════════════════════════════════════════════════

    // Инвертированный прогресс: максимум до входа во вьюпорт, спадает при появлении
    const sectionThreeInvertedProgress = useTransform(sectionThreeEnterProgress, (v) => 1 - v);

    // Opacity для FloatingBalls «Дорога» — вынесен на верхний уровень, чтобы не нарушать rules of hooks
    const ballsWayOpacity = useTransform(sectionThreeEnterProgress, [0, 1], [0, 1]);
    const ballsPlaceOpacity = useTransform(sectionOneEnterProgress, [0, 1], [0, 1]);

    const { WaveFilter: WaveFilterBallsPlace, containerRef: containerRefBallsPlace } =
        useWaveEffect(sectionThreeInvertedProgress, { maxScale: 90, alwaysOn: true });
    const { WaveFilter: WaveFilterBallsWay, containerRef: containerRefBallsWay } = useWaveEffect(
        sectionThreeInvertedProgress,
        { maxScale: 90, alwaysOn: true }
    );

    // Сброс filter при включении сберегающего режима
    useEffect(() => {
        if (isSavingMode) {
            if (containerRefBallsPlace.current)
                containerRefBallsPlace.current.style.filter = 'none';
            if (containerRefBallsWay.current) containerRefBallsWay.current.style.filter = 'none';
        }
    }, [isSavingMode, containerRefBallsPlace, containerRefBallsWay]);

    // ═══════════════════════════════════════════════════════════════
    // SECTION ANIMATIONS
    // ═══════════════════════════════════════════════════════════════

    const sectionOne = useScrollSection({
        enter: {
            progress: sectionOneEnterEffective,
            props: { x: [-300, 0], opacity: [0, 1] },
        },
        exit: {
            progress: sectionOneExitProgress,
            props: { x: [0, -200], opacity: [1, 0.2] },
        },
    });

    const sectionHeading = useScrollSection({
        enter: {
            progress: sectionOneEnterProgress,
            range: isMobileLayout ? [0, 0.6] : [0.3, 1],
            props: isMobileLayout
                ? { x: [-300, 0], opacity: [0, 1] }
                : { scale: [0, 1], x: [600, 0], y: [200, 0], opacity: [0, 1] },
        },
        exit: {
            progress: sectionOneExitProgress,
            props: {
                scale: [1, 0.8],
                x: [0, 0, -200],
                y: [0, 0, 200],
                opacity: { values: [1, 0], range: [0, 0.6] },
            },
        },
    });

    const sectionTitle = useScrollSection({
        enter: {
            progress: headingRightEffective,
            props: isMobileLayout
                ? { x: [300, 0], opacity: [0, 1] }
                : { scale: [0, 1], x: [-200, 0], y: [200, 0], opacity: [0, 1] },
        },
        exit: {
            progress: sectionOneExitProgress,
            props: {},
        },
    });

    const sectionThree = useScrollSection({
        enter: {
            progress: sectionThreeEnterEffective,
            props: { x: [600, 0], opacity: [0, 1] },
        },
        exit: {
            progress: sectionThreeExitProgress,
            props: {
                x: [0, 0, 200],
                opacity: { values: [1, 1, 0.2], range: [0, 0.6] },
            },
        },
    });

    return (
        <section id="aboutHero" className="about-hero">
            <NameSection />

            <div className="about-hero-sections">
                <div id="place" className="about-hero-my-place">
                    {/* Section One — Glass Card */}
                    {/*<WaveFilter />*/}
                    <motion.div
                        ref={sectionOneRef}
                        className="glass-card about-hero-section-one"
                        style={sectionOne.style}
                    >
                        <SectionOneContent />
                    </motion.div>

                    {/* Section Two — Heading + FloatingBalls (десктоп: шары внутри right-колонки) */}
                    <div className="about-hero-right">
                        <motion.div
                            className="about-hero-section-heading"
                            style={{ transformOrigin: 'left bottom', ...sectionHeading.style }}
                        >
                            <h2>Откуда я такой взялся</h2>
                            <span>немного о местности</span>
                        </motion.div>

                        {!isMobileLayout && (
                            <motion.div
                                style={{
                                    opacity: ballsPlaceOpacity,
                                    width: '100%',
                                }}
                            >
                                {!isMobile && !isSafari && !isSavingMode && (
                                    <WaveFilterBallsPlace />
                                )}
                                <FloatingBalls
                                    images={PHOTOS}
                                    altImages={ALT_PHOTOS}
                                    className="floating-balls-my-place"
                                    containerRef={containerRefBallsPlace}
                                    autoSwitch={isMobile}
                                />
                            </motion.div>
                        )}
                    </div>

                    {/* FloatingBalls — на мобилке выносится после glass-card */}
                    {isMobileLayout && (
                        <motion.div
                            style={{
                                opacity: ballsPlaceOpacity,
                                width: '100%',
                            }}
                        >
                            <FloatingBalls
                                images={PHOTOS}
                                altImages={ALT_PHOTOS}
                                className="floating-balls-my-place"
                                containerRef={containerRefBallsPlace}
                                autoSwitch={isMobile}
                            />
                        </motion.div>
                    )}
                </div>

                {/* Section Title — about-hero-left */}

                <div id="way" className="about-hero-my-way">
                    {/*<WaveFilterLeft />*/}
                    <div className="about-hero-left">
                        <motion.div
                            ref={sectionTitleRef}
                            className="about-hero-section-heading about-hero-section-heading--right"
                            style={{ transformOrigin: 'left bottom', ...sectionTitle.style }}
                        >
                            <h2>Дорога длиною в жизнь</h2>
                            <span>некоторые моменты</span>

                            {/* Десктоп/планшет: шары внутри sticky-заголовка — двигаются вместе с ним */}
                            {!isMobileLayout && (
                                <motion.div style={{ opacity: ballsWayOpacity }}>
                                    {!isMobile && !isSafari && !isSavingMode && (
                                        <WaveFilterBallsWay />
                                    )}
                                    <FloatingBalls
                                        images={MY_PHOTOS}
                                        altImages={MY_ALT_PHOTOS}
                                        className="floating-balls-my-way"
                                        containerRef={containerRefBallsWay}
                                        autoSwitch={isMobile}
                                    />
                                </motion.div>
                            )}
                        </motion.div>
                        {/* Мобилка: полоса фото снаружи заголовка */}
                        {isMobileLayout && (
                            <motion.div
                                ref={photoStripRef}
                                style={{ y: photoStripY, opacity: photoStripCombinedOpacity }}
                            >
                                <MobilePhotoStrip
                                    images={MY_PHOTOS}
                                    altImages={MY_ALT_PHOTOS}
                                    className="mobile-photo-strip--way"
                                />
                            </motion.div>
                        )}
                    </div>

                    {/* Section Three */}
                    <motion.div
                        ref={sectionThreeRef}
                        className="glass-card about-hero-section-three"
                        style={{ transformOrigin: 'right bottom', ...sectionThree.style }}
                    >
                        <SectionThreeContent gateProgress={sectionThreeEnterEffective} />
                    </motion.div>
                </div>
            </div>
        </section>
    );
});

AboutHero.displayName = 'AboutHero';

export default AboutHero;
