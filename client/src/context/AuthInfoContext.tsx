import { getUserProfile, logoutUser } from 'client/src/services/api.service';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { AuthInfoContext } from '@/context/createAuthInfoContext.ts';
import { DEMO_USER, IS_DEMO } from '@/pages/dashboard/demoData';
import type { User } from '@/types/auth-info-context.types.ts';

export const AuthInfoProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        if (IS_DEMO) return;
        try {
            const profile = await getUserProfile();
            setUser(profile as User);
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    }, []);

    useEffect(() => {
        if (IS_DEMO) {
            setUser(DEMO_USER);
            setIsLoading(false);
            return;
        }

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

    const login = useCallback((userData: User) => {
        setUser(userData);
    }, []);

    const logout = useCallback(async () => {
        if (IS_DEMO) {
            setUser(null);
            return;
        }
        await logoutUser();
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({
            user,
            isAuthenticated: !!user,
            login,
            logout,
            isLoading,
            refreshUser,
        }),
        [user, isLoading, login, logout, refreshUser]
    );

    return <AuthInfoContext.Provider value={value}>{children}</AuthInfoContext.Provider>;
};
