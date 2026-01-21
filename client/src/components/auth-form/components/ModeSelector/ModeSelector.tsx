import { memo } from 'react';
import { motion } from 'framer-motion';
import type { ViewMode } from 'client/src/types/auth.types';
import { SPRING_CONFIG } from 'client/src/constants/auth.constants';
import { LoginIcon, RegisterIcon, ResetIcon } from 'client/src/assets/icons';
import 'client/src/components/auth-form/components/ModeSelector/mode-selector.css';

interface ModeSelectorProps {
    currentMode: ViewMode;
    onModeChange: (mode: ViewMode) => void;
}

const modes: {
    value: ViewMode;
    label: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
}[] = [
    { value: 'login', label: 'Вход', icon: LoginIcon },
    { value: 'register', label: 'Регистрация', icon: RegisterIcon },
    { value: 'reset', label: 'Восстановление', icon: ResetIcon },
];

export const ModeSelector = memo<ModeSelectorProps>(({ currentMode, onModeChange }) => (
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
                    <Icon className="mode-icon" />
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
));

ModeSelector.displayName = 'ModeSelector';
