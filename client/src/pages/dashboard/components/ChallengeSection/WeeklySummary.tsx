import type { WeeklySummary as WeeklySummaryType } from '../../types';

interface WeeklySummaryProps {
    summary: WeeklySummaryType;
}

export function WeeklySummary({ summary }: WeeklySummaryProps) {
    const { totalCompleted, totalFailed } = summary;
    if (totalCompleted === 0 && totalFailed === 0) return null;

    return (
        <p className="weekly-summary">
            На этой неделе: <span className="weekly-summary__done">{totalCompleted} выполнено</span>
            , <span className="weekly-summary__failed">{totalFailed} провалено</span>
        </p>
    );
}
