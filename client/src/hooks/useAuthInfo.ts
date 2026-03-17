import { useContext } from 'react';
import { AuthInfoContext } from '@/context/createAuthInfoContext.ts';

export const useAuthInfo = () => {
    const context = useContext(AuthInfoContext);
    if (!context) {
        throw new Error('useAuthInfo must be used within AuthProvider');
    }
    return context;
};
