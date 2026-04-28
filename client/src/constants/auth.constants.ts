import type {
    FormData,
    FormErrors,
    ModeConfig,
    TouchedFields,
    ViewMode,
} from 'client/src/types/auth.types';

// Test credentials — читаются из .env.local (не коммитится)
// Заполни client/.env.local: VITE_TEST_EMAIL=... VITE_TEST_PASS=...
const TEST_USER_EMAIL = import.meta.env.VITE_TEST_EMAIL ?? '';
const TEST_USER_PASS = import.meta.env.VITE_TEST_PASS ?? '';

// Demo mode credentials — локальная переменная чтобы не импортировать из demoData.ts
// (исключает циклическую зависимость: demoData → constants → demoData)
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL ?? '';
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? '';

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

    const email = IS_DEMO_MODE ? DEMO_EMAIL : isDev ? TEST_USER_EMAIL : '';
    const password =
        IS_DEMO_MODE && mode === 'login'
            ? DEMO_PASSWORD
            : isDev && mode === 'login'
              ? TEST_USER_PASS
              : '';

    const base: FormData = { email, password };

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
