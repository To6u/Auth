import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import '@/pages/profile/components/hero/hero.css';

const ANIMATION_DELAY = 200;

const Hero = () => {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end start'],
    });

    // Левые буквы: влево-вверх
    const leftX = useTransform(scrollYProgress, [0, 0.5], [0, -50]); // vw
    const leftY = useTransform(scrollYProgress, [0, 0.5], [0, -50]); // vh

    // Правые буквы: вправо-вверх
    const rightX = useTransform(scrollYProgress, [0, 0.5], [0, 50]);
    const rightY = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

    const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), ANIMATION_DELAY);
        return () => clearTimeout(timer);
    }, []);

    return (
        <section id="deer" className="hero" ref={containerRef}>
            <div className={`hero__content ${isVisible ? 'visible' : ''}`}>
                <div className="hero__letters">
                    <motion.span
                        className="letter letter--pulse"
                        style={{
                            x: useTransform(leftX, (v) => `${v}vw`),
                            y: useTransform(leftY, (v) => `${v}vh`),
                            opacity,
                        }}
                    >
                        D
                    </motion.span>
                    <motion.span
                        className="letter letter--pulse"
                        style={{
                            x: useTransform(rightX, (v) => `${v}vw`),
                            y: useTransform(rightY, (v) => `${v}vh`),
                            opacity,
                        }}
                    >
                        E
                    </motion.span>
                </div>
                <div className="hero__letters">
                    <motion.span
                        className="letter letter--pulse"
                        style={{
                            x: useTransform(leftX, (v) => `${v}vw`),
                            y: useTransform(leftY, (v) => `${v}vh`),
                            opacity,
                        }}
                    >
                        E
                    </motion.span>
                    <motion.span
                        className="letter letter--pulse"
                        style={{
                            x: useTransform(rightX, (v) => `${v}vw`),
                            y: useTransform(rightY, (v) => `${v}vh`),
                            opacity,
                        }}
                    >
                        R
                    </motion.span>
                </div>
            </div>
        </section>
    );
};

export default Hero;
