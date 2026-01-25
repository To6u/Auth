import { memo, useState, useRef, useCallback } from 'react';
import { motion, useInView, useScroll, useTransform, MotionValue } from 'framer-motion';
import { useTypewriter } from '@/hooks/useTypewriter';
import { PopoverTrigger } from '@/components/popover-trigger/PopoverTrigger';
import { fadeInUp } from './animations';
import { TYPEWRITER_WORDS, TYPEWRITER_CONFIG } from './constants';
import './about-hero.css';

/** Хелпер для комбинирования MotionValue (enter * exit) */
const useCombinedOpacity = (enter: MotionValue<number>, exit: MotionValue<number>) => {
    return useTransform(() => enter.get() * exit.get());
};

export const AboutHero = memo(() => {
    const nameRef = useRef<HTMLDivElement>(null);
    const sectionOneRef = useRef<HTMLDivElement>(null);
    const sectionThreeRef = useRef<HTMLDivElement>(null);

    const isNameInView = useInView(nameRef, { once: true, margin: '-100px' });

    // ═══════════════════════════════════════════════════════════════
    // SCROLL PROGRESS
    // ═══════════════════════════════════════════════════════════════

    // Section One: появление (от входа в viewport до полного появления)
    const { scrollYProgress: sectionOneEnterProgress } = useScroll({
        target: sectionOneRef,
        offset: ['start end', 'start 20%'], // появляется когда верх секции доходит до 60% viewport
    });

    // Section One: выход (когда секция уходит вверх за viewport)
    const { scrollYProgress: sectionOneExitProgress } = useScroll({
        target: sectionOneRef,
        offset: ['start 160px', 'end start'],
    });

    // Section Three: выход
    const { scrollYProgress: sectionThreeExitProgress } = useScroll({
        target: sectionThreeRef,
        offset: ['start 160px', 'end start'],
    });

    // Section Three: появление
    const { scrollYProgress: sectionThreeEnterProgress } = useScroll({
        target: sectionThreeRef,
        offset: ['start end', 'start 20%'],
    });

    // ═══════════════════════════════════════════════════════════════
    // SECTION ONE — полностью scroll-driven (без variants)
    // ═══════════════════════════════════════════════════════════════

    // Enter анимация
    const sectionOneEnterX = useTransform(sectionOneEnterProgress, [0, 1], [-300, 0]);
    const sectionOneEnterOpacity = useTransform(sectionOneEnterProgress, [0, 1], [0, 1]);

    // Exit анимация
    const sectionOneExitOpacity = useTransform(sectionOneExitProgress, [0, 1], [1, 0.2]);
    const sectionOneExitX = useTransform(sectionOneExitProgress, [0, 1], [0, -200]);

    // Комбинированная opacity (enter * exit)
    const sectionOneOpacity = useCombinedOpacity(sectionOneEnterOpacity, sectionOneExitOpacity);
    const sectionOneX = useTransform(() => sectionOneEnterX.get() + sectionOneExitX.get());

    // ═══════════════════════════════════════════════════════════════
    // SECTION TWO — полностью scroll-driven
    // ═══════════════════════════════════════════════════════════════

    // Enter анимация (появляется из правого нижнего угла)
    const sectionTwoEnterScale = useTransform(sectionOneEnterProgress, [0.3, 1], [0, 1]);
    const sectionTwoEnterX = useTransform(sectionOneEnterProgress, [0.3, 1], [600, 0]);
    const sectionTwoEnterY = useTransform(sectionOneEnterProgress, [0.3, 1], [200, 0]);
    const sectionTwoEnterOpacity = useTransform(sectionOneEnterProgress, [0.3, 1], [0, 1]);

    // Exit анимация
    const sectionTwoExitScale = useTransform(sectionOneExitProgress, [0, 1], [1, 0.8]);
    const sectionTwoExitX = useTransform(sectionOneExitProgress, [0, 1], [0, 0, -200]);
    const sectionTwoExitY = useTransform(sectionOneExitProgress, [0, 1], [0, 0, 200]);
    const sectionTwoExitOpacity = useTransform(sectionOneExitProgress, [0, 0.6], [1, 0]);

    // Комбинированные значения
    const sectionTwoOpacity = useCombinedOpacity(sectionTwoEnterOpacity, sectionTwoExitOpacity);
    const sectionTwoScale = useTransform(() => sectionTwoEnterScale.get() * sectionTwoExitScale.get());
    const sectionTwoX = useTransform(() => sectionTwoEnterX.get() + sectionTwoExitX.get());
    const sectionTwoY = useTransform(() => sectionTwoEnterY.get() + sectionTwoExitY.get());

    // ═══════════════════════════════════════════════════════════════
    // SECTION THREE — полностью scroll-driven
    // ═══════════════════════════════════════════════════════════════

    // Enter анимация (появляется из левого нижнего угла)
    const sectionThreeEnterX = useTransform(sectionThreeEnterProgress, [0, 1], [600, 0]);
    const sectionThreeEnterOpacity = useTransform(sectionThreeEnterProgress, [0, 1], [0, 1]);

    // Exit анимация
    const sectionThreeExitX = useTransform(sectionThreeExitProgress, [0, 0.7, 1], [0, 0, 200]);
    const sectionThreeExitOpacity = useTransform(sectionThreeExitProgress, [0, 0.6], [1, 1, 0.2]);

    // Комбинированные значения
    const sectionThreeOpacity = useCombinedOpacity(sectionThreeEnterOpacity, sectionThreeExitOpacity);
    const sectionThreeX = useTransform(() => sectionThreeEnterX.get() + sectionThreeExitX.get());

    // ═══════════════════════════════════════════════════════════════
    // SECTION TITLE — полностью scroll-driven
    // ═══════════════════════════════════════════════════════════════

    // Enter анимация (появляется когда Section Two начинает исчезать)
    const sectionTitleEnterScale = useTransform(sectionOneExitProgress, [0, 1], [0, 1]);
    const sectionTitleEnterX = useTransform(sectionOneExitProgress, [0, 1], [-200, 0]);
    const sectionTitleEnterY = useTransform(sectionOneExitProgress, [0, 1], [200, 0]);
    const sectionTitleEnterOpacity = useTransform(sectionOneExitProgress, [0, 1], [0, 1]);

    // ═══════════════════════════════════════════════════════════════
    // STATE & CALLBACKS
    // ═══════════════════════════════════════════════════════════════

    const [showFrontend, setShowFrontend] = useState(false);

    const handleFirstWordComplete = useCallback(() => setShowFrontend(true), []);

    const { text: typewriterText } = useTypewriter({
        words: TYPEWRITER_WORDS,
        ...TYPEWRITER_CONFIG,
        enabled: isNameInView,
        onFirstWordComplete: handleFirstWordComplete,
    });

    return (
        <section id="aboutHero" className="about-hero">
            {/* Name Section */}
            <div className="about-name" ref={nameRef}>
                <motion.span
                    className="name"
                    variants={fadeInUp}
                    initial="hidden"
                    animate={isNameInView ? 'visible' : 'hidden'}
                    transition={{ duration: 1, ease: 'easeOut' }}
                >
                    Niyaz
                </motion.span>

                <span className="typewriter" style={{ opacity: isNameInView ? 1 : 0, transition: 'opacity 0.3s' }}>
                    {typewriterText}
                    <span className="typewriter__cursor">|</span>
                </span>

                <motion.span
                    variants={fadeInUp}
                    initial="hidden"
                    animate={showFrontend ? 'visible' : 'hidden'}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    Frontend
                </motion.span>
            </div>

            {/* Sections */}
            <div className="about-hero-sections">
                {/* Section One - Glass Card (полностью scroll-driven) */}
                <motion.div
                    ref={sectionOneRef}
                    className="glass-card about-hero-section-one"
                    style={{
                        x: sectionOneX,
                        opacity: sectionOneOpacity,
                    }}
                >
                    <SectionOneContent />
                </motion.div>

                {/* Section Two - Sticky Title (полностью scroll-driven) */}
                <div className="about-hero-right">
                    <motion.div
                        className="about-hero-section-heading"
                        style={{
                            transformOrigin: 'left bottom',
                            scale: sectionTwoScale,
                            x: sectionTwoX,
                            y: sectionTwoY,
                            opacity: sectionTwoOpacity,
                        }}
                    >
                        <h2>Откуда я такой взялся</h2>
                        <span>родные края</span>
                    </motion.div>
                </div>

                {/* Section Title (полностью scroll-driven) */}
                <div className="about-hero-left">
                    <motion.div
                        className="about-hero-section-heading about-hero-section-heading--right"
                        style={{
                            transformOrigin: 'left bottom',
                            scale: sectionTitleEnterScale,
                            x: sectionTitleEnterX,
                            y: sectionTitleEnterY,
                            opacity: sectionTitleEnterOpacity,
                        }}
                    >
                        <h2>Дорога длиною в жизнь</h2>
                        <span>некоторые моменты</span>
                    </motion.div>
                </div>

                {/* Section Three (полностью scroll-driven) */}
                <motion.div
                    ref={sectionThreeRef}
                    className="glass-card about-hero-section-three"
                    style={{
                        transformOrigin: 'right bottom',
                        x: sectionThreeX,
                        opacity: sectionThreeOpacity,
                    }}
                >
                    <SectionThreeContent />
                </motion.div>
            </div>
        </section>
    );
});

AboutHero.displayName = 'AboutHero';

/* Контент секций вынесен для читаемости */
const SectionOneContent = memo(() => (
    <div className="about-section">
        <div className="about-section__content">
            <span>Откуда?</span>
            <p>
                Привет! Меня зовут Нияз. Я из небольшого поселка под названием{' '}
                <PopoverTrigger id="popover-barda" content="Село в Пермском крае, основано в 1740 году">
                    Барда
                </PopoverTrigger>
                , который располагается недалеко от города{' '}
                <PopoverTrigger id="popover-perm" content="Город-миллионник на Урале">
                    Перми
                </PopoverTrigger>
                .
            </p>

            <span>и Чё там есть?</span>
            <p>
                Да в принципе немного, природа, пруд, речка{' '}
                <PopoverTrigger id="popover-kazmakty" content="Небольшая речка в Бардымском районе">
                    Казмакты
                </PopoverTrigger>{' '}
                который втекает в речку побольше{' '}
                <PopoverTrigger id="popover-tulva" content="Река длиной 118 км, приток Камы">
                    Тулву
                </PopoverTrigger>
                , а так отличное место чтобы отдохнуть от городской суеты.
            </p>

            <span>да, круто, что еще можешь рассказать?</span>
            <p>Чего рассказывать, пока сам не увидишь не поймешь, для кого-то «дыра дырой», кому-то родной край.</p>
            <span>пс. мне ближе то, что последее</span>
        </div>
    </div>
));

SectionOneContent.displayName = 'SectionOneContent';

const SectionThreeContent = memo(() => (
    <>
        <div className="about-section">
            <h2 className="about-section__title">Детство</h2>
            <div className="about-section__content">
                <p>
                    Привет! Я фронтенд-разработчик, который любит создавать интерактивные сайты с продуманным дизайном и
                    плавными анимациями.
                </p>
                <p>
                    Работаю на стеке <span>React</span>, <span>TypeScript</span> — превращаю идеи в живые интерфейсы,
                    которыми приятно пользоваться.
                </p>
                <p>
                    Когда не пишу код, зимой меня можно найти на горке со сноубордом, а летом — на речке. Баланс важен
                    (˶ˆᗜˆ˵)
                </p>
            </div>
            <h2 className="about-section__title">Школьные годы</h2>
            <div className="about-section__content">
                <p>
                    Привет! Я фронтенд-разработчик, который любит создавать интерактивные сайты с продуманным дизайном и
                    плавными анимациями.
                </p>
                <p>
                    Работаю на стеке <span>React</span>, <span>TypeScript</span> — превращаю идеи в живые интерфейсы,
                    которыми приятно пользоваться.
                </p>
                <p>
                    Когда не пишу код, зимой меня можно найти на горке со сноубордом, а летом — на речке. Баланс важен
                    (˶ˆᗜˆ˵)
                </p>
            </div>
            <h2 className="about-section__title">Студенчество</h2>
            <div className="about-section__content">
                <p>
                    Привет! Я фронтенд-разработчик, который любит создавать интерактивные сайты с продуманным дизайном и
                    плавными анимациями.
                </p>
                <p>
                    Работаю на стеке <span>React</span>, <span>TypeScript</span> — превращаю идеи в живые интерфейсы,
                    которыми приятно пользоваться.
                </p>
                <p>
                    Когда не пишу код, зимой меня можно найти на горке со сноубордом, а летом — на речке. Баланс важен
                    (˶ˆᗜˆ˵)
                </p>
            </div>
        </div>
    </>
));

SectionThreeContent.displayName = 'SectionThreeContent';

export default AboutHero;
