import { ANIMATION_DURATION, BUTTON_SPRING_CONFIG } from 'client/src/constants/auth.constants.ts';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, type ReactNode } from 'react';
import './submit.css';

interface SubmitButtonProps {
    isLoading: boolean;
    buttonText: string;
    loadingText?: string;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    animationDirection?: 'left' | 'right';
    onClick?: () => void;
    type?: 'submit' | 'button';
    'aria-label'?: string;
    'aria-expanded'?: boolean;
    'aria-controls'?: string;
}

export const SubmitButton = memo<SubmitButtonProps>(
    ({
        isLoading,
        buttonText,
        loadingText = 'Загрузка...',
        icon,
        iconPosition = 'left',
        animationDirection = 'left',
        onClick,
        type = 'submit',
        'aria-label': ariaLabel,
        'aria-expanded': ariaExpanded,
        'aria-controls': ariaControls,
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
            aria-label={ariaLabel}
            aria-expanded={ariaExpanded}
            aria-controls={ariaControls}
        >
            <span className="wave wave-1" aria-hidden="true"></span>
            <span className="wave wave-2" aria-hidden="true"></span>
            <span className="wave wave-3" aria-hidden="true"></span>
            <span className="wave wave-4" aria-hidden="true"></span>
            <AnimatePresence mode="wait" initial={false}>
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
                    {icon && iconPosition === 'right' && (
                        <span className="button-icon">{icon}</span>
                    )}
                </motion.span>
            </AnimatePresence>
        </motion.button>
    )
);

SubmitButton.displayName = 'SubmitButton';
