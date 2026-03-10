import { getPasswordStrength, STRENGTH_LABELS } from '@/utils/validation.utils';
import './password-strength.css';

const SEGMENT_COUNT = 4;

interface PasswordStrengthProps {
    password: string;
    /** Show when the password field is focused or has a value */
    visible: boolean;
}

export const PasswordStrength = ({ password, visible }: PasswordStrengthProps) => {
    const strength = getPasswordStrength(password);

    return (
        <div
            className={`password-strength${visible ? ' password-strength--visible' : ''}${strength > 0 ? ` password-strength--level-${strength}` : ''}`}
            aria-live="polite"
            aria-atomic="true"
        >
            <div className="password-strength__segments" aria-hidden="true">
                {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
                    <div
                        key={i}
                        className={`password-strength__segment${i < strength ? ` password-strength__segment--level-${strength}` : ''}`}
                    />
                ))}
            </div>

            <span
                className="password-strength__label"
                aria-label={password ? `Надёжность пароля: ${STRENGTH_LABELS[strength]}` : ''}
            >
                {password ? STRENGTH_LABELS[strength] : ''}
            </span>
        </div>
    );
};
