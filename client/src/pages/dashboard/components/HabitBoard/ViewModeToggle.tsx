import type { HabitViewMode } from '../../types';

interface ViewModeToggleProps {
    value: HabitViewMode;
    onChange: (mode: HabitViewMode) => void;
}

const MODES: { value: HabitViewMode; label: string }[] = [
    { value: 'today', label: 'Сегодня' },
    { value: 'month', label: 'Месяц' },
    { value: 'year', label: 'Год' },
];

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
    return (
        <div className="view-mode-toggle">
            {MODES.map((m) => (
                <button
                    key={m.value}
                    type="button"
                    className={`view-mode-toggle__btn${m.value === 'today' ? ' view-mode-toggle__btn--today' : ''}${value === m.value ? ' view-mode-toggle__btn--active' : ''}`}
                    onClick={() => onChange(m.value)}
                >
                    {m.label}
                </button>
            ))}
        </div>
    );
}
