import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { EyeIcon, EyeOffIcon } from 'client/src/assets/icons';

export type MatchStatus = 'match' | 'mismatch' | 'none';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    touched?: boolean;
    showPasswordToggle?: boolean;
    isPasswordVisible?: boolean;
    onTogglePassword?: () => void;
    /** Show ✓ / ✗ icon for confirm-password fields. Omit prop to hide entirely. */
    matchStatus?: MatchStatus;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
    (
        {
            label,
            error,
            touched,
            id,
            className = '',
            showPasswordToggle = false,
            isPasswordVisible = false,
            onTogglePassword,
            matchStatus,
            onChange,
            onAnimationStart,
            ...props
        },
        ref
    ) => {
        const hasError = touched && error;

        const handleAnimationStart = (e: React.AnimationEvent<HTMLInputElement>) => {
            if (e.animationName === 'autofill-start') {
                onChange?.(e as unknown as React.ChangeEvent<HTMLInputElement>);
            }
            onAnimationStart?.(e);
        };

        return (
            <div className={`input-field-wrapper ${className}`}>
                <label htmlFor={id} className="input-label">
                    {label}
                </label>

                <div className="input-container">
                    <input
                        ref={ref}
                        id={id}
                        className={`input-field ${hasError ? 'input-error' : ''}`}
                        aria-invalid={hasError ? 'true' : 'false'}
                        aria-describedby={hasError ? `${id}-error` : undefined}
                        onChange={onChange}
                        onAnimationStart={handleAnimationStart}
                        {...props}
                    />

                    {showPasswordToggle && (
                        <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={onTogglePassword}
                            aria-label={
                                isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'
                            }
                            tabIndex={-1}
                        >
                            {isPasswordVisible ? (
                                <EyeOffIcon className="toggle-icon" />
                            ) : (
                                <EyeIcon className="toggle-icon" />
                            )}
                        </button>
                    )}

                    {matchStatus !== undefined && (
                        <span
                            className={`input-match-icon${matchStatus === 'match' ? ' input-match-icon--match' : matchStatus === 'mismatch' ? ' input-match-icon--mismatch' : ''}`}
                            aria-live="polite"
                            aria-label={
                                matchStatus === 'match'
                                    ? 'Пароли совпадают'
                                    : matchStatus === 'mismatch'
                                      ? 'Пароли не совпадают'
                                      : ''
                            }
                        >
                            {matchStatus === 'match' ? '✓' : matchStatus === 'mismatch' ? '✗' : ''}
                        </span>
                    )}
                </div>

                {hasError && (
                    <motion.span
                        id={`${id}-error`}
                        className="input-error-message"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        role="alert"
                    >
                        {error}
                    </motion.span>
                )}
            </div>
        );
    }
);

InputField.displayName = 'InputField';