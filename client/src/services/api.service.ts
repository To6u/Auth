import {
    type CheckEmailResponse,
    CheckEmailResponseSchema,
    type LoginResponse,
    LoginResponseSchema,
    type RegisterResponse,
    RegisterResponseSchema,
    type User,
    UserSchema,
} from './api.schemas';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RegisterData {
    email: string;
    password: string;
}

interface LoginData {
    email: string;
    password: string;
}

/**
 * Register new user
 */
export const registerUser = async (data: RegisterData): Promise<RegisterResponse> => {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.error || 'Ошибка регистрации');
    }

    return RegisterResponseSchema.parse(responseData);
};

/**
 * Login user — сервер устанавливает httpOnly cookie, токен не возвращается в теле
 */
export const loginUser = async (data: LoginData): Promise<LoginResponse> => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.error || 'Ошибка входа');
    }

    return LoginResponseSchema.parse(responseData);
};

/**
 * Get user profile (protected route) — cookie прикладывается браузером автоматически
 */
export const getUserProfile = async (): Promise<User> => {
    const res = await fetch(`${API_URL}/user/profile`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.error || 'Ошибка получения профиля');
    }

    return UserSchema.parse(responseData);
};

/**
 * Logout user — сервер очищает httpOnly cookie
 */
export const logoutUser = async (): Promise<void> => {
    await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    });
};

/**
 * Check if email exists
 */
export const checkEmail = async (email: string): Promise<CheckEmailResponse> => {
    const res = await fetch(`${API_URL}/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.error || 'Ошибка проверки email');
    }

    return CheckEmailResponseSchema.parse(responseData);
};

/**
 * Reset password
 */
export const resetPassword = async (email: string, newPassword: string): Promise<void> => {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, newPassword }),
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.error || 'Ошибка сброса пароля');
    }
};
