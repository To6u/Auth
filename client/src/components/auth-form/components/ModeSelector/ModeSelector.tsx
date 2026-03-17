import { memo } from 'react';
import { LoginIcon, RegisterIcon, ResetIcon } from '@/assets/icons';
import type { Tab } from '@/components/tabs';
import { TabSelector } from '@/components/tabs';
import type { ViewMode } from '@/types/auth.types';

interface ModeSelectorProps {
    currentMode: ViewMode;
    onModeChange: (mode: ViewMode) => void;
}

const AUTH_MODES: Tab<ViewMode>[] = [
    { value: 'login', label: 'Вход', icon: LoginIcon },
    { value: 'register', label: 'Регистрация', icon: RegisterIcon },
    { value: 'reset', label: 'Восстановление', icon: ResetIcon },
];

export const ModeSelector = memo<ModeSelectorProps>(({ currentMode, onModeChange }) => (
    <TabSelector
        tabs={AUTH_MODES}
        activeTab={currentMode}
        onTabChange={onModeChange}
        name="auth-mode"
        centered
    />
));

ModeSelector.displayName = 'ModeSelector';
