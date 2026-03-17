import { motion, useInView } from 'framer-motion';
import { memo, useCallback, useRef, useState } from 'react';
import { useTypewriter } from '@/hooks/useTypewriter';
import { fadeInUp } from '../animations';
import { TYPEWRITER_CONFIG, TYPEWRITER_WORDS } from '../constants';

export const NameSection = memo(() => {
    const nameRef = useRef<HTMLDivElement>(null);
    const isNameInView = useInView(nameRef, { once: true, margin: '-100px' });

    const [showFrontend, setShowFrontend] = useState(false);
    const handleFirstWordComplete = useCallback(() => setShowFrontend(true), []);

    const { text: typewriterText } = useTypewriter({
        words: TYPEWRITER_WORDS,
        ...TYPEWRITER_CONFIG,
        enabled: isNameInView,
        onFirstWordComplete: handleFirstWordComplete,
    });

    return (
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

            <span
                className="typewriter"
                style={{ opacity: isNameInView ? 1 : 0, transition: 'opacity 0.3s' }}
            >
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
    );
});

NameSection.displayName = 'NameSection';
