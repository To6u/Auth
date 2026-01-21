import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
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

const AboutHero = memo(() => {
    const nameRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstWordRef = useRef(true);

    const isNameInView = useInView(nameRef, { once: false, margin: '-100px' });
    const isCardInView = useInView(cardRef, { once: false, margin: '-100px' });

    const [typewriterState, setTypewriterState] = useState({
        text: '',
        wordIndex: 0,
        isDeleting: false,
    });

    const [showName, setShowName] = useState(false);
    const [showTypewriter, setShowTypewriter] = useState(false);
    const [showFrontend, setShowFrontend] = useState(false);

    // Очистка таймера
    const clearTypewriterTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    // Сброс состояния
    const resetState = useCallback(() => {
        clearTypewriterTimeout();
        isFirstWordRef.current = true;
        setTypewriterState({ text: '', wordIndex: 0, isDeleting: false });
        setShowTypewriter(false);
        setShowFrontend(false);
        setShowName(false);
    }, [clearTypewriterTimeout]);

    // Анимация name блока
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        if (isNameInView) {
            // Используем setTimeout с 0 чтобы избежать синхронного setState
            timer = setTimeout(() => {
                setShowName(true);
                setTimeout(() => setShowTypewriter(true), 800);
            }, 0);
        } else {
            timer = setTimeout(resetState, 200);
        }

        return () => clearTimeout(timer);
    }, [isNameInView, resetState]);

    // Typewriter логика
    useEffect(() => {
        if (!showTypewriter) return;

        const { text, wordIndex, isDeleting } = typewriterState;
        const word = WORDS[wordIndex];

        if (!isDeleting) {
            if (text.length < word.length) {
                timeoutRef.current = setTimeout(() => {
                    setTypewriterState(prev => ({
                        ...prev,
                        text: word.slice(0, prev.text.length + 1),
                    }));
                }, TYPING_SPEED);
            } else {
                // Слово допечатано
                if (isFirstWordRef.current) {
                    isFirstWordRef.current = false;
                    setShowFrontend(true);
                }
                timeoutRef.current = setTimeout(() => {
                    setTypewriterState(prev => ({ ...prev, isDeleting: true }));
                }, PAUSE_AFTER_TYPING);
            }
        } else {
            if (text.length > 0) {
                timeoutRef.current = setTimeout(() => {
                    setTypewriterState(prev => ({
                        ...prev,
                        text: word.slice(0, prev.text.length - 1),
                    }));
                }, DELETING_SPEED);
            } else {
                timeoutRef.current = setTimeout(() => {
                    setTypewriterState(prev => ({
                        text: '',
                        wordIndex: (prev.wordIndex + 1) % WORDS.length,
                        isDeleting: false,
                    }));
                }, PAUSE_AFTER_DELETING);
            }
        }

        return clearTypewriterTimeout;
    }, [showTypewriter, typewriterState, clearTypewriterTimeout]);

    return (
        <section id="aboutHero" className="about-hero">
            <div className="about-name" ref={nameRef}>
                <motion.span
                    variants={fadeInUp}
                    initial="hidden"
                    animate={showName ? 'visible' : 'hidden'}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="name"
                >
                    Нияз
                </motion.span>

                <span
                    className="typewriter"
                    style={{ opacity: showTypewriter ? 1 : 0, transition: 'opacity 0.3s' }}
                >
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

            <motion.div
                className="glass-card"
                ref={cardRef}
                variants={fadeInUp}
                initial="hidden"
                animate={isCardInView ? 'visible' : 'hidden'}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                <div className="about-section">
                    <h2 className="about-section__title">Обо мне</h2>
                    <div className="about-section__content">
                        <p>
                            Привет! Я фронтенд-разработчик, который любит создавать интерактивные сайты с продуманным
                            дизайном и плавными анимациями.
                        </p>
                        <p>
                            Работаю на стеке <span>React</span>, <span>TypeScript</span> — превращаю идеи в живые
                            интерфейсы, которыми приятно пользоваться.
                        </p>
                        <p>
                            Когда не пишу код, зимой меня можно найти на горке со сноубордом, а летом — на речке. Баланс
                            важен (˶ˆᗜˆ˵)
                        </p>
                    </div>
                </div>

                <div className="about-section">
                    <h2 className="about-section__title">Фотографии</h2>
                    <div className="photo-gallery">{/* TODO: добавить фотографии */}</div>
                </div>
            </motion.div>
        </section>
    );
});

AboutHero.displayName = 'AboutHero';

export default AboutHero;