import { memo, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useScrollSection } from './hooks/useScrollSection';
import { useWaveEffect } from '@/hooks/useWaveEffect';
import { NameSection, SectionOneContent, SectionThreeContent } from './components';
import FloatingBalls from '@/components/floating-balls/FloatingBalls';
import './about-hero.css';

const imageModules = import.meta.glob('@/assets/about-images/*.jpg', {
    eager: true,
    query: '?url',
    import: 'default',
});

const PHOTOS = Object.values(imageModules) as string[];

export const AboutHero = memo(() => {
    const sectionOneRef = useRef<HTMLDivElement>(null);
    const sectionThreeRef = useRef<HTMLDivElement>(null);

    // ═══════════════════════════════════════════════════════════════
    // SCROLL PROGRESS (источники для всех анимаций)
    // ═══════════════════════════════════════════════════════════════

    const { scrollYProgress: sectionOneEnterProgress } = useScroll({
        target: sectionOneRef,
        offset: ['40% end', 'start 20%'],
    });

    const { scrollYProgress: sectionOneExitProgress } = useScroll({
        target: sectionOneRef,
        offset: ['start 160px', 'end start'],
    });

    const { scrollYProgress: sectionThreeEnterProgress } = useScroll({
        target: sectionThreeRef,
        offset: ['start end', 'start 20%'],
    });

    const { scrollYProgress: sectionThreeExitProgress } = useScroll({
        target: sectionThreeRef,
        offset: ['40% start', 'end start'],
    });

    // ═══════════════════════════════════════════════════════════════
    // WAVE EFFECTS
    // ═══════════════════════════════════════════════════════════════

    // Инвертированный прогресс: максимум до входа во вьюпорт, спадает при появлении
    const sectionThreeInvertedProgress = useTransform(sectionThreeEnterProgress, (v) => 1 - v);

    const { WaveFilter: WaveFilterBallsPlace, containerRef: containerRefBallsPlace } = useWaveEffect(
        sectionThreeInvertedProgress,
        { maxScale: 90, alwaysOn: true }
    );
    const { WaveFilter: WaveFilterBallsWay, containerRef: containerRefBallsWay } = useWaveEffect(
        sectionThreeInvertedProgress,
        { maxScale: 90, alwaysOn: true }
    );

    // ═══════════════════════════════════════════════════════════════
    // SECTION ANIMATIONS
    // ═══════════════════════════════════════════════════════════════

    const sectionOne = useScrollSection({
        enter: {
            progress: sectionOneEnterProgress,
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
            range: [0.3, 1],
            props: { scale: [0, 1], x: [600, 0], y: [200, 0], opacity: [0, 1] },
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
            progress: sectionOneExitProgress,
            props: { scale: [0, 1], x: [-200, 0], y: [200, 0], opacity: [0, 1] },
        },
        exit: {
            progress: sectionOneExitProgress,
            props: {},
        },
    });

    const sectionThree = useScrollSection({
        enter: {
            progress: sectionThreeEnterProgress,
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

                    {/* Section Two — Heading + FloatingBalls */}
                    <div className="about-hero-right">
                        <motion.div
                            className="about-hero-section-heading"
                            style={{ transformOrigin: 'left bottom', ...sectionHeading.style }}
                        >
                            <h2>Откуда я такой взялся</h2>
                            <span>немного о местности</span>
                        </motion.div>

                        <motion.div style={{ opacity: useTransform(sectionOneEnterProgress, [0, 1], [0, 1]) }}>
                            <WaveFilterBallsPlace />
                            <FloatingBalls images={PHOTOS} className="floating-balls-my-place" containerRef={containerRefBallsPlace} />
                        </motion.div>
                    </div>
                </div>

                {/* Section Title — about-hero-left */}

                <div id="way" className="about-hero-my-way">
                    {/*<WaveFilterLeft />*/}
                    <div className="about-hero-left">
                        <motion.div
                            className="about-hero-section-heading about-hero-section-heading--right"
                            style={{ transformOrigin: 'left bottom', ...sectionTitle.style }}
                        >
                            <h2>Дорога длиною в жизнь</h2>
                            <span>некоторые моменты</span>

                            <motion.div style={{ opacity: useTransform(sectionThreeEnterProgress, [0, 1], [0, 1]) }}>
                                <WaveFilterBallsWay />
                                <FloatingBalls
                                    images={PHOTOS}
                                    className="floating-balls-my-way"
                                    containerRef={containerRefBallsWay}
                                />
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Section Three */}
                    <motion.div
                        ref={sectionThreeRef}
                        className="glass-card about-hero-section-three"
                        style={{ transformOrigin: 'right bottom', ...sectionThree.style }}
                    >
                        <SectionThreeContent gateProgress={sectionThreeEnterProgress} />
                    </motion.div>
                </div>
            </div>
        </section>
    );
});

AboutHero.displayName = 'AboutHero';

export default AboutHero;
