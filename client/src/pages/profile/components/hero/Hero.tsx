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

    const leftXVw = useTransform(scrollYProgress, [0, 0.5], ['0vw', '-50vw']);
    const leftYVh = useTransform(scrollYProgress, [0, 0.5], ['0vh', '-50vh']);
    const rightXVw = useTransform(scrollYProgress, [0, 0.5], ['0vw', '50vw']);
    const rightYVh = useTransform(scrollYProgress, [0, 0.5], ['0vh', '-50vh']);
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
                        style={{ x: leftXVw, y: leftYVh, opacity }}
                    >
                        D
                    </motion.span>
                    <motion.span
                        className="letter letter--pulse"
                        style={{ x: rightXVw, y: rightYVh, opacity }}
                    >
                        E
                    </motion.span>
                </div>
                <div className="hero__letters">
                    <motion.span
                        className="letter letter--pulse"
                        style={{ x: leftXVw, y: leftYVh, opacity }}
                    >
                        E
                    </motion.span>
                    <motion.span
                        className="letter letter--pulse"
                        style={{ x: rightXVw, y: rightYVh, opacity }}
                    >
                        R
                    </motion.span>
                </div>
            </div>
        </section>
    );
};

export default Hero;
