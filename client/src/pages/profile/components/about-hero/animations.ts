import type { Variants } from 'framer-motion';

const customEase = [0.215, 0.61, 0.355, 1] as const;

export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20, transition: { duration: 1, ease: customEase } },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: customEase } },
};
