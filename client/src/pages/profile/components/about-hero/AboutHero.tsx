import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import './about-hero.css';

const WORDS = ['разрабатывает', 'интересуется', 'играется', 'вдохновляется', 'удивляется', 'любит'];
const TYPING_SPEED = 100;
const DELETING_SPEED = 50;
const PAUSE_AFTER_TYPING = 2000;
const PAUSE_AFTER_DELETING = 300;

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const slideFadeLeftVariants = {
    hidden: {
        x: -300,
        opacity: 0,
    },
    visible: {
        x: 0,
        opacity: 1,
        transition: { duration: 0.5, ease: 'easeOut' },
    },
};

const curtainVariants = {
    hidden: {
        scaleY: 0,
        opacity: 0,
    },
    visible: {
        scaleY: 1,
        opacity: 1,
        transition: { duration: 0.5, ease: 'easeOut' },
    },
};

const sectionTitleAppearVariants = {
    hidden: {
        scale: 0,
        opacity: 0,
        x: -200,
        y: 200,
    },
    visible: {
        scale: 1,
        opacity: 1,
        x: 0,
        y: 0,
        transition: { duration: 0.8, ease: 'easeOut' },
    },
};

interface PopoverTriggerProps {
    id: string;
    children: React.ReactNode;
    content: string;
}

const PopoverTrigger = ({ id, children, content }: PopoverTriggerProps) => {
    const triggerRef = useRef<HTMLElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const updatePopoverPosition = () => {
        const trigger = triggerRef.current;
        const popover = popoverRef.current;
        if (!trigger || !popover) return;

        const rect = trigger.getBoundingClientRect();
        popover.style.top = `${rect.bottom + window.scrollY + 8}px`;
        popover.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
        popover.style.transform = 'translateX(-50%)';
    };

    const handleMouseEnter = () => {
        updatePopoverPosition();
        popoverRef.current?.showPopover();
    };

    const handleMouseLeave = () => {
        popoverRef.current?.hidePopover();
    };

    return (
        <>
            <b ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                {children}
            </b>
            <div ref={popoverRef} popover="manual" id={id} className="info-popover">
                {content}
            </div>
        </>
    );
};

const AboutHero = memo(() => {
    const nameRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstWordRef = useRef(true);
    const lastScrollY = useRef(0);
    const hasAnimated = useRef(false);

    const sectionsRef = useRef<HTMLDivElement>(null);
    const sectionOneRef = useRef<HTMLDivElement>(null);
    const sectionThreeRef = useRef<HTMLDivElement>(null);

    const isNameInView = useInView(nameRef, { once: false, margin: '-100px' });
    const isSectionsInView = useInView(sectionsRef, { once: false, margin: '-100px' });

    const { scrollYProgress } = useScroll({
        target: sectionOneRef,
        offset: ['start 60px', 'end start'],
    });

    const { scrollYProgress: scrollYProgressThree } = useScroll({
        target: sectionThreeRef,
        offset: ['start 60px', 'end start'],
    });

    // Section Two — исчезновение
    const sectionTwoScale = useTransform(scrollYProgress, [0, 1], [1, 0]);
    const sectionTwoX = useTransform(scrollYProgress, [0, 0.7, 1], [0, 0, -200]);
    const sectionTwoY = useTransform(scrollYProgress, [0, 0.7, 1], [0, 0, 200]);
    const sectionTwoOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

    // Section Title — исчезновение
    const sectionTitleScale = useTransform(scrollYProgressThree, [0, 1], [1, 0]);
    const sectionTitleX = useTransform(scrollYProgressThree, [0, 0.7, 1], [0, 0, 200]);
    const sectionTitleY = useTransform(scrollYProgressThree, [0, 0.7, 1], [0, 0, 200]);
    const sectionTitleOpacity = useTransform(scrollYProgressThree, [0, 0.6], [1, 0]);

    const [typewriterState, setTypewriterState] = useState({
        text: '',
        wordIndex: 0,
        isDeleting: false,
    });

    const [showName, setShowName] = useState(false);
    const [showTypewriter, setShowTypewriter] = useState(false);
    const [showFrontend, setShowFrontend] = useState(false);
    const [showSectionTwo, setShowSectionTwo] = useState(false);
    const [showSectionOne, setShowSectionOne] = useState(false);
    const [showSectionTitle, setShowSectionTitle] = useState(false);
    const [titleAnimationComplete, setTitleAnimationComplete] = useState(false);

    const clearTypewriterTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const resetState = useCallback(() => {
        clearTypewriterTimeout();
        isFirstWordRef.current = true;
        hasAnimated.current = false;
        setTypewriterState({ text: '', wordIndex: 0, isDeleting: false });
        setShowTypewriter(false);
        setShowFrontend(false);
        setShowName(false);
        setShowSectionTwo(false);
        setShowSectionOne(false);
        setShowSectionTitle(false);
        setTitleAnimationComplete(false);
    }, [clearTypewriterTimeout]);

    // Отслеживание opacity для показа section-title
    useMotionValueEvent(sectionTwoOpacity, 'change', (latest) => {
        setShowSectionTitle(latest <= 0.1);
        if (latest > 0.1) {
            setTitleAnimationComplete(false);
        }
    });

    // Анимация name блока
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const currentScrollY = window.scrollY;
        const isScrollingUp = currentScrollY < lastScrollY.current;
        lastScrollY.current = currentScrollY;

        if (isNameInView && !hasAnimated.current) {
            hasAnimated.current = true;
            timer = setTimeout(() => {
                setShowName(true);
                setTimeout(() => setShowTypewriter(true), 800);
            }, 0);
        } else if (!isNameInView && isScrollingUp && hasAnimated.current) {
            hasAnimated.current = false;
            timer = setTimeout(resetState, 200);
        }

        return () => clearTimeout(timer);
    }, [isNameInView, resetState]);

    // Анимация секций
    useEffect(() => {
        if (!isSectionsInView) return;

        setShowSectionOne(true);

        const timer = setTimeout(() => {
            setShowSectionTwo(true);
        }, 300);

        return () => clearTimeout(timer);
    }, [isSectionsInView]);

    // Typewriter логика
    useEffect(() => {
        if (!showTypewriter) return;

        const { text, wordIndex, isDeleting } = typewriterState;
        const word = WORDS[wordIndex];

        if (!isDeleting) {
            if (text.length < word.length) {
                timeoutRef.current = setTimeout(() => {
                    setTypewriterState((prev) => ({
                        ...prev,
                        text: word.slice(0, prev.text.length + 1),
                    }));
                }, TYPING_SPEED);
            } else {
                if (isFirstWordRef.current) {
                    isFirstWordRef.current = false;
                    queueMicrotask(() => setShowFrontend(true));
                }
                timeoutRef.current = setTimeout(() => {
                    setTypewriterState((prev) => ({ ...prev, isDeleting: true }));
                }, PAUSE_AFTER_TYPING);
            }
        } else {
            if (text.length > 0) {
                timeoutRef.current = setTimeout(() => {
                    setTypewriterState((prev) => ({
                        ...prev,
                        text: word.slice(0, prev.text.length - 1),
                    }));
                }, DELETING_SPEED);
            } else {
                timeoutRef.current = setTimeout(() => {
                    setTypewriterState({
                        text: '',
                        wordIndex: (wordIndex + 1) % WORDS.length,
                        isDeleting: false,
                    });
                }, PAUSE_AFTER_DELETING);
            }
        }

        return clearTypewriterTimeout;
    }, [showTypewriter, typewriterState, clearTypewriterTimeout]);

    const handleTitleAnimationComplete = () => {
        if (showSectionTitle) {
            setTitleAnimationComplete(true);
        }
    };

    return (
        <section id="aboutHero" className="about-hero">
            <div className="about-name" ref={nameRef}>
                <motion.span
                    variants={fadeInUp}
                    initial="hidden"
                    animate={showName ? 'visible' : 'hidden'}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="name"
                >
                    Niyaz
                </motion.span>

                <span className="typewriter" style={{ opacity: showTypewriter ? 1 : 0, transition: 'opacity 0.3s' }}>
                    {typewriterState.text}
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

            <div className="about-hero-sections" ref={sectionsRef}>
                <motion.div
                    ref={sectionOneRef}
                    className="glass-card about-hero-section-one"
                    variants={slideFadeLeftVariants}
                    initial="hidden"
                    animate={showSectionOne ? 'visible' : 'hidden'}
                >
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
                            <p>
                                Чего рассказывать, пока сам не увидишь не поймешь, для кого-то «дыра дырой», кому-то
                                родной край.
                            </p>
                            <span>пс. мне ближе то, что последее</span>
                        </div>
                    </div>
                </motion.div>

                <div className="about-hero-right">
                    <motion.div
                        className="about-hero-section-two"
                        variants={curtainVariants}
                        initial="hidden"
                        animate={showSectionTwo ? 'visible' : 'hidden'}
                        style={{
                            transformOrigin: 'left bottom',
                            scale: sectionTwoScale,
                            x: sectionTwoX,
                            y: sectionTwoY,
                            opacity: sectionTwoOpacity,
                        }}
                    >
                        <h2>Откуда я такой взялся</h2>
                    </motion.div>
                </div>

                <div className="about-hero-left">
                    <motion.div
                        className="about-hero-section-title"
                        variants={sectionTitleAppearVariants}
                        initial="hidden"
                        animate={showSectionTitle ? 'visible' : 'hidden'}
                        onAnimationComplete={handleTitleAnimationComplete}
                        style={{
                            transformOrigin: 'left bottom',
                            ...(titleAnimationComplete && {
                                scale: sectionTitleScale,
                                x: sectionTitleX,
                                y: sectionTitleY,
                                opacity: sectionTitleOpacity,
                            }),
                        }}
                    >
                        <h2>Дорога длиною в жизнь</h2>
                        <span>некоторые моменты</span>
                    </motion.div>
                </div>

                <div className="glass-card about-hero-section-three" ref={sectionThreeRef}>
                    <div className="about-section">
                        <h2 className="about-section__title">Обо мне</h2>
                        <div className="about-section__content">
                            <p>
                                Привет! Я фронтенд-разработчик, который любит создавать интерактивные сайты с
                                продуманным дизайном и плавными анимациями.
                            </p>
                            <p>
                                Работаю на стеке <span>React</span>, <span>TypeScript</span> — превращаю идеи в живые
                                интерфейсы, которыми приятно пользоваться.
                            </p>
                            <p>
                                Когда не пишу код, зимой меня можно найти на горке со сноубордом, а летом — на речке.
                                Баланс важен (˶ˆᗜˆ˵)
                            </p>
                        </div>
                    </div>

                    <div className="about-section">
                        <h2 className="about-section__title">Фотографии</h2>
                        <div className="photo-gallery">{/* TODO: добавить фотографии */}</div>
                    </div>
                </div>
            </div>
        </section>
    );
});

AboutHero.displayName = 'AboutHero';

export default AboutHero;