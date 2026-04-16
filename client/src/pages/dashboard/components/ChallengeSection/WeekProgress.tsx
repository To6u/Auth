import type { ChallengeAssignment } from '../../types';
import { getWeekStart } from '../../utils/dateUtils';

interface WeekProgressProps {
    assignments: ChallengeAssignment[];
    selectedDate: string;
    onDayClick: (dateStr: string) => void;
}

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function WeekProgress({ assignments, selectedDate, onDayClick }: WeekProgressProps) {
    const weekStart = getWeekStart(new Date());
    const todayStr = new Date().toISOString().split('T')[0];

    const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const assignment = assignments.find((a) => a.date === dateStr);
        const isPast = dateStr < todayStr;
        const hasAssignment = assignment !== undefined;
        const isFuture = dateStr > todayStr;
        const status =
            assignment?.status ?? (dateStr === todayStr ? 'active' : isPast ? 'failed' : 'empty');
        return {
            label: DAY_LABELS[i],
            dateStr,
            status,
            isToday: dateStr === todayStr,
            isSelected: dateStr === selectedDate,
            clickable: hasAssignment || !isFuture,
        };
    });

    return (
        <div className="week-progress">
            {days.map((day) => (
                <div
                    key={day.label}
                    className={`week-progress__day${day.clickable ? ' week-progress__day--clickable' : ''}${day.isSelected ? ' week-progress__day--selected' : ''}`}
                    onClick={() => day.clickable && onDayClick(day.dateStr)}
                >
                    <span
                        className={`week-progress__dot week-progress__dot--${day.status}${day.isToday ? ' week-progress__dot--today' : ''}`}
                    />
                    <span
                        className={`week-progress__label${day.isToday ? ' week-progress__label--today' : ''}`}
                    >
                        {day.label}
                    </span>
                </div>
            ))}
        </div>
    );
}
