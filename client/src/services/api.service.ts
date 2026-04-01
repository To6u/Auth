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
const IS_MOCK = import.meta.env.VITE_MOCK_AUTH === 'true';

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
    if (IS_MOCK) return { message: 'ok', userId: 0 };
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
    if (IS_MOCK)
        return { user: { id: 0, email: data.email, created_at: new Date().toISOString() } };
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
    if (IS_MOCK) throw new Error('mock: no session');
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
    if (IS_MOCK) return;
    await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    });
};

/**
 * Check if email exists
 */
export const checkEmail = async (email: string): Promise<CheckEmailResponse> => {
    if (IS_MOCK) return { emailExists: true };
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
    if (IS_MOCK) return;
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
