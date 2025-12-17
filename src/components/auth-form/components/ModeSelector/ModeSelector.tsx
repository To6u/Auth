import { memo } from 'react';
import { motion } from 'framer-motion';
import type { ViewMode } from '@/types/auth.types';
import { SPRING_CONFIG } from '@/constants/auth.constants';
import { LogIn, UserPlus, KeyRound } from 'lucide-react';
import "./mode-selector.css";

interface ModeSelectorProps {
    currentMode: ViewMode;
    onModeChange: (mode: ViewMode) => void;
}

const modes: { value: ViewMode; label: string; icon: typeof LogIn }[] = [
    { value: 'login', label: 'Вход', icon: LogIn },
    { value: 'register', label: 'Регистрация', icon: UserPlus },
    { value: 'reset', label: 'Восстановление', icon: KeyRound },
];

export const ModeSelector = memo<ModeSelectorProps>(
    ({ currentMode, onModeChange }) => (
        <div className="mode-selector">
            {modes.map(({ value, label, icon: Icon }) => (
                <div key={value} className="mode-item">
                    <label className={`mode-label ${currentMode === value ? 'active' : ''}`}>
                        <input
                            type="radio"
                            name="auth-mode"
                            value={value}
                            checked={currentMode === value}
                            onChange={() => onModeChange(value)}
                            className="mode-radio"
                        />
                        <Icon className="mode-icon" size={24} strokeWidth={2} />
                        <span className="mode-tooltip">{label}</span>
                        {currentMode === value && (
                            <motion.div
                                className="active-indicator"
                                layoutId="activeMode"
                                transition={{
                                    type: 'spring',
                                    ...SPRING_CONFIG,
                                }}
                            />
                        )}
                    </label>
                </div>
            ))}
        </div>
    )
);

ModeSelector.displayName = 'ModeSelector';