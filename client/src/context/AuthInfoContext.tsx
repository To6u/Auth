import {ReactNode, useEffect, useState} from 'react';
import {getUserProfile, isAuthenticated, logoutUser} from 'client/src/services/api.service';
import {User} from "@/types/auth-info-context.types.ts";
import { AuthInfoContext } from '@/context/createAuthInfoContext.ts';

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
        const checkAuth = async () => {
            if (isAuthenticated()) {
                await refreshUser();
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
    };

    const logout = () => {
        logoutUser();
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