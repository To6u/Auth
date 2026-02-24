import type { ViewMode, ModeConfig, FormData, FormErrors, TouchedFields } from 'client/src/types/auth.types';

// Test credentials
export const TEST_USER_EMAIL = 'user@user.com';
export const TEST_USER_PASS = 'fsdafasfad12C';

// Validation constants
export const MIN_PASSWORD_LENGTH = 6;

// Email regex pattern
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Animation timings
export const ANIMATION_DURATION = {
    fast: 0.15,
    normal: 0.2,
    slow: 0.3,
};

export const SPRING_CONFIG = {
    stiffness: 380,
    damping: 30,
};

export const BUTTON_SPRING_CONFIG = {
    stiffness: 400,
    damping: 17,
};

// Mode configurations
export const MODE_CONFIGS: Record<ViewMode, ModeConfig> = {
    login: {
        title: 'Авторизация',
        buttonText: 'Войти',
        fieldsToValidate: ['email', 'password'],
    },
    register: {
        title: 'Регистрация',
        buttonText: 'Зарегистрироваться',
        fieldsToValidate: ['email', 'password', 'confirmPassword'],
    },
    reset: {
        title: 'Вспомнить пароль',
        buttonText: 'Вспомнить',
        fieldsToValidate: ['email'],
    },
};

// Success messages
export const SUCCESS_MESSAGES: Record<ViewMode, string> = {
    login: 'Успешная авторизация!',
    register: 'Регистрация прошла успешно!',
    reset: 'Инструкции отправлены на email!',
};

// Initial form states
export const getInitialFormData = (mode: ViewMode): FormData => {
    const isDev = import.meta.env.DEV;

    const base: FormData = {
        email: isDev ? TEST_USER_EMAIL : '', // Автозаполнение в dev
        password: isDev && mode === 'login' ? TEST_USER_PASS : '', // Только для login
    };

    if (mode === 'register') {
        return {
            ...base,
            confirmPassword: '',
        };
    }

    if (mode === 'reset') {
        return {
            email: '',
            password: '',
            newPassword: '',
            confirmNewPassword: '',
        };
    }

    return base;
};

export const INITIAL_ERRORS: FormErrors = {
    email: '',
    password: '',
    confirmPassword: '',
    newPassword: '',
    confirmNewPassword: '',
};

export const INITIAL_TOUCHED: TouchedFields = {
    email: false,
    password: false,
    confirmPassword: false,
    newPassword: false,
    confirmNewPassword: false,
};
