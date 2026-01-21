import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {ANIMATION_DURATION} from "client/src/constants/auth.constants.ts";

interface AnimatedTitleProps {
    title: string;
}

export const AnimatedTitle = memo<AnimatedTitleProps>(({ title }) => (
    <AnimatePresence mode="wait">
        <motion.h2
            key={title}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: ANIMATION_DURATION.normal }}
        >
            {title}
        </motion.h2>
    </AnimatePresence>
));

AnimatedTitle.displayName = 'AnimatedTitle';