import { memo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ANIMATION_DURATION, BUTTON_SPRING_CONFIG } from "client/src/constants/auth.constants.ts";
import "client/src/components/auth-form/components/SubmitButton/submit.css";

interface SubmitButtonProps {
    isLoading: boolean;
    buttonText: string;
    loadingText?: string;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    animationDirection?: 'left' | 'right';
    onClick?: () => void;
    type?: 'submit' | 'button';
}

export const SubmitButton = memo<SubmitButtonProps>(({
                                                         isLoading,
                                                         buttonText,
                                                         loadingText = 'Загрузка...',
                                                         icon,
                                                         iconPosition = 'left',
                                                         animationDirection = 'left',
                                                         onClick,
                                                         type = 'submit'
                                                     }) => (
    <motion.button
        type={type}
        disabled={isLoading}
        className={`submit-button ${isLoading ? 'loading' : ''} ${animationDirection === 'right' ? 'reverse-animation' : ''}`}
        layout
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        transition={{
            type: 'spring',
            ...BUTTON_SPRING_CONFIG,
        }}
        onClick={onClick}
        aria-busy={isLoading}
    >
        <span className="wave wave-1" aria-hidden="true"></span>
        <span className="wave wave-2" aria-hidden="true"></span>
        <span className="wave wave-3" aria-hidden="true"></span>
        <span className="wave wave-4" aria-hidden="true"></span>
        <AnimatePresence mode="wait">
            <motion.span
                key={isLoading ? 'loading' : 'idle'}
                className="button-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: ANIMATION_DURATION.fast }}
            >
                {icon && iconPosition === 'left' && <span className="button-icon">{icon}</span>}
                <span>{isLoading ? loadingText : buttonText}</span>
                {icon && iconPosition === 'right' && <span className="button-icon">{icon}</span>}
            </motion.span>
        </AnimatePresence>
    </motion.button>
));

SubmitButton.displayName = 'SubmitButton';