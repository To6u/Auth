import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {ANIMATION_DURATION, BUTTON_SPRING_CONFIG} from "@/constants/auth.constants.ts";
import "./submit.css";

interface SubmitButtonProps {
    isLoading: boolean;
    buttonText: string;
}

export const SubmitButton = memo<SubmitButtonProps>(({ isLoading, buttonText }) => (
    <motion.button
        type="submit"
        disabled={isLoading}
        className={`submit-button ${isLoading && "loading"}`}
        layout
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        transition={{
            type: 'spring',
            ...BUTTON_SPRING_CONFIG,
        }}
        aria-busy={isLoading}
    >
        <span className="wave wave-1" aria-hidden="true"></span>
        <span className="wave wave-2" aria-hidden="true"></span>
        <span className="wave wave-3" aria-hidden="true"></span>
        <span className="wave wave-4" aria-hidden="true"></span>
        <AnimatePresence mode="wait">
            <motion.span
                key={buttonText}
                className="button-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: ANIMATION_DURATION.fast }}
            >
                {isLoading ? 'Загрузка...' : buttonText}
            </motion.span>
        </AnimatePresence>
    </motion.button>
));

SubmitButton.displayName = 'SubmitButton';
