import {
    EMAIL_REGEX,
    MIN_PASSWORD_LENGTH,
    MIN_NAME_LENGTH,
} from '../constants/auth.constants';

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
export const validateConfirmPassword = (
    confirmPassword: string,
    password: string
): string => {
    if (!confirmPassword) {
        return 'Подтверждение пароля обязательно';
    }

    if (confirmPassword !== password) {
        return 'Пароли не совпадают';
    }

    return '';
};

/**
 * Validates user name
 */
export const validateName = (name: string): string => {
    if (!name) {
        return 'Имя обязательно для заполнения';
    }

    if (name.length < MIN_NAME_LENGTH) {
        return `Имя должно содержать минимум ${MIN_NAME_LENGTH} символа`;
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
        case 'name':
            return validateName;
        default:
            return () => '';
    }
};
