import { getUserProfile, logoutUser } from 'client/src/services/api.service';
import { type ReactNode, useEffect, useState } from 'react';
import { AuthInfoContext } from '@/context/createAuthInfoContext.ts';
import type { User } from '@/types/auth-info-context.types.ts';

export const AuthInfoProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const profile = await getUserProfile();
            setUser(profile as User);
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    useEffect(() => {
        // Всегда проверяем сессию через сервер — cookie прикладывается браузером автоматически
        const checkAuth = async () => {
            try {
                const profile = await getUserProfile();
                setUser(profile as User);
            } catch {
                setUser(null); // cookie нет или истёк — не авторизован
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
    };

    const logout = async () => {
        await logoutUser();
        setUser(null);
    };

    return (
        <AuthInfoContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                login,
                logout,
                isLoading,
                refreshUser,
            }}
        >
            {children}
        </AuthInfoContext.Provider>
    );
};
