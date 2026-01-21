import { memo } from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
    isExiting?: boolean;
}

export const Logo = memo<LogoProps>(({ isExiting = false }) => (
    <motion.div
        className="wave-trip-logo"
        initial={{
            opacity: 0,
            scale: 0.3,
            y: 50
        }}
        animate={isExiting ? {
            scale: 0.3,
            opacity: 0,
            rotate: -45,
            y: 50,
        } : {
            scale: 1,
            opacity: 1,
            rotate: 0,
            y: 0,
        }}
        transition={
            isExiting
                ? { duration: 0.5, ease: 'easeInOut' }
                : {
                    duration: 0.8,
                    ease: [0.34, 1.56, 0.64, 1],
                    delay: 0.5
                }
        }
        whileHover={!isExiting ? { scale: 1.05, rotate: 5 } : {}}
        aria-label="Wave Trip Logo"
    />
));

Logo.displayName = 'Logo';