import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'animation-saving-mode';

interface AnimationModeContextValue {
    isSavingMode: boolean;
    toggleSavingMode: () => void;
}

const AnimationModeContext = createContext<AnimationModeContextValue | null>(null);

export function AnimationModeProvider({ children }: { children: ReactNode }) {
    const [isSavingMode, setIsSavingMode] = useState(
        () => localStorage.getItem(STORAGE_KEY) === 'true'
    );

    useEffect(() => {
        document.documentElement.classList.toggle('saving-mode', isSavingMode);
        localStorage.setItem(STORAGE_KEY, String(isSavingMode));
    }, [isSavingMode]);

    const toggleSavingMode = useCallback(() => setIsSavingMode((v) => !v), []);

    return (
        <AnimationModeContext.Provider value={{ isSavingMode, toggleSavingMode }}>
            {children}
        </AnimationModeContext.Provider>
    );
}

export function useAnimationMode(): AnimationModeContextValue {
    const ctx = useContext(AnimationModeContext);
    if (!ctx) throw new Error('useAnimationMode must be used within AnimationModeProvider');
    return ctx;
}
