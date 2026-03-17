import { EMAIL_REGEX, MIN_PASSWORD_LENGTH } from 'client/src/constants/auth.constants';

// ─────────────────────────────────────────────────────────────
// Password strength
// ─────────────────────────────────────────────────────────────

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export const STRENGTH_LABELS: Record<PasswordStrength, string> = {
    0: '',
    1: 'Слабый',
    2: 'Средний',
    3: 'Надёжный',
    4: 'Отличный',
};

/**
 * Scores a password on a 1-4 scale.
 * 0 = empty, 1 = weak, 2 = medium, 3 = strong, 4 = very strong.
 *
 * Criteria (each +1 point):
 *   length ≥ 6, ≥ 8, ≥ 12, ≥ 16
 *   uppercase [A-Z], lowercase [a-z], digit [0-9], special char
 */
export function getPasswordStrength(password: string): PasswordStrength {
    if (!password) return 0;

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // Map score 1-8 → level 1-4
    if (score <= 2) return 1;
    if (score <= 4) return 2;
    if (score <= 6) return 3;
    return 4;
}

/**
 * Validates email format
 */
export const validateEmail = (email: string): string => {
    if (!email) {
        return 'Email обязателен для заполнения';
    }

    if (!EMAIL_REGEX.test(email)) {
        return 'Введите корректный email адрес';
    }

    return '';
};

/**
 * Validates password strength
 */
export const validatePassword = (password: string): string => {
    if (!password) {
        return 'Пароль обязателен для заполнения';
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов`;
    }

    return '';
};

/**
 * Validates password confirmation match
 */
export const validateConfirmPassword = (confirmPassword: string, password: string): string => {
    if (!confirmPassword) {
        return 'Подтверждение пароля обязательно';
    }

    if (confirmPassword !== password) {
        return 'Пароли не совпадают';
    }

    return '';
};

/**
 * Get validator function by field name
 */
export const getFieldValidator = (
    fieldName: string,
    password?: string
): ((value: string) => string) => {
    switch (fieldName) {
        case 'email':
            return validateEmail;
        case 'password':
            return validatePassword;
        case 'confirmPassword':
            return (value: string) => validateConfirmPassword(value, password || '');
        default:
            return () => '';
    }
};
