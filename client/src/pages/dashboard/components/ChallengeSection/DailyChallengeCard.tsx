import { Check, X } from 'lucide-react';
import type { Challenge, ChallengeAssignment } from '../../types';

interface DailyChallengeCardProps {
    assignment: ChallengeAssignment;
    challenge: Challenge;
    completionHistory: ChallengeAssignment[];
    onComplete: (id: string) => void;
    onFail: (id: string) => void;
    onUncomplete: (id: string) => void;
}

export function DailyChallengeCard({
    assignment,
    challenge,
    completionHistory,
    onComplete,
    onFail,
    onUncomplete,
}: DailyChallengeCardProps) {
    const isDone = assignment.status === 'done';
    const isFailed = assignment.status === 'failed';
    const isActive = assignment.status === 'active';

    return (
        <div className={`daily-challenge-card daily-challenge-card--${assignment.status}`}>
            {/* Левая колонка — карточка дня */}
            <div className="daily-challenge-card__main">
                <p className="daily-challenge-card__label">Сегодня</p>
                <div className="daily-challenge-card__heading">
                    <h3 className="daily-challenge-card__title">{challenge.title}</h3>
                    {challenge.icon && (
                        <span className="daily-challenge-card__icon" aria-hidden="true">
                            {challenge.icon}
                        </span>
                    )}
                </div>
                {challenge.description && (
                    <p className="daily-challenge-card__desc">{challenge.description}</p>
                )}
                <div className="daily-challenge-card__actions">
                    {isActive && (
                        <>
                            <button
                                type="button"
                                className="daily-challenge-card__btn daily-challenge-card__btn--complete"
                                onClick={() => onComplete(assignment.id)}
                            >
                                <Check size={13} />
                                Выполнено
                            </button>
                            <button
                                type="button"
                                className="daily-challenge-card__btn daily-challenge-card__btn--fail"
                                onClick={() => onFail(assignment.id)}
                            >
                                <X size={13} />
                                Провалено
                            </button>
                        </>
                    )}
                    {isDone && (
                        <>
                            <span className="daily-challenge-card__status-badge daily-challenge-card__status-badge--done">
                                ✓ Выполнено
                            </span>
                            <button
                                type="button"
                                className="daily-challenge-card__undo-btn"
                                onClick={() => onUncomplete(assignment.id)}
                            >
                                ↩ Отменить
                            </button>
                        </>
                    )}
                    {isFailed && (
                        <>
                            <span className="daily-challenge-card__status-badge daily-challenge-card__status-badge--failed">
                                ✕ Провалено
                            </span>
                            <button
                                type="button"
                                className="daily-challenge-card__undo-btn"
                                onClick={() => onUncomplete(assignment.id)}
                            >
                                ↩ Отменить
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Правая колонка — история выполнений */}
            <div className="daily-challenge-card__history">
                <p className="daily-challenge-card__history-label">
                    Выполнено раз:{' '}
                    <strong className="daily-challenge-card__history-count">
                        {completionHistory.length}
                    </strong>
                </p>
                {completionHistory.length > 0 ? (
                    <ul className="daily-challenge-card__history-list">
                        {completionHistory.map((a) => (
                            <li key={a.id} className="daily-challenge-card__history-item">
                                <span className="daily-challenge-card__history-dot" />
                                <time
                                    dateTime={a.date}
                                    className="daily-challenge-card__history-date"
                                >
                                    {a.date}
                                </time>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="daily-challenge-card__history-empty">Ещё не выполнялся</p>
                )}
            </div>
        </div>
    );
}
