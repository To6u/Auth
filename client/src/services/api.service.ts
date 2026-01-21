const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RegisterData {
    email: string;
    password: string;
}

interface LoginData {
    email: string;
    password: string;
}

interface AuthResponse {
    token: string;
    user: {
        id: number;
        email: string;
    };
}

interface RegisterResponse {
    message: string;
    userId: number;
}

/**
 * Register new user
 */
export const registerUser = async (data: RegisterData): Promise<RegisterResponse> => {
    const res = await fetch(`${API_URL}/auth/register`, {  // <- /auth/register
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.error || 'Ошибка регистрации');
    }

    return responseData;
};

/**
 * Login user
 */
export const loginUser = async (data: LoginData): Promise<AuthResponse> => {
    const res = await fetch(`${API_URL}/auth/login`, {  // <- /auth/login
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.error || 'Ошибка входа');
    }

    // Сохраняем токен и пользователя
    localStorage.setItem('token', responseData.token);
    localStorage.setItem('user', JSON.stringify(responseData.user));

    return responseData;
};

/**
 * Get user profile (protected route)
 */
export const getUserProfile = async (): Promise<AuthResponse['user']> => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('Токен не найден');
    }

    const res = await fetch(`${API_URL}/user/profile`, {  // <- /user/profile
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.error || 'Ошибка получения профиля');
    }

    return responseData;
};

/**
 * Logout user
 */
export const logoutUser = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = (): AuthResponse['user'] | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('token');
};

/**
 * Check if email exists
 */
export const checkEmail = async (email: string): Promise<{ emailExists: boolean }> => {
    const res = await fetch(`${API_URL}/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.error || 'Ошибка проверки email');
    }

    return responseData;
};

/**
 * Reset password
 */
export const resetPassword = async (email: string, newPassword: string): Promise<void> => {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.error || 'Ошибка сброса пароля');
    }
};