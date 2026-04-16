import type { Challenge, ChallengeAssignment } from '../../types';

interface AchievementsListProps {
    assignments: ChallengeAssignment[];
    challenges: Challenge[];
}

export function AchievementsList({ assignments, challenges }: AchievementsListProps) {
    const done = assignments.filter((a) => a.status === 'done');
    if (done.length === 0) return null;

    return (
        <details className="achievements-list">
            <summary className="achievements-list__summary">
                Выполненные челленджи ({done.length})
            </summary>
            <ul className="achievements-list__items">
                {done.map((a) => {
                    const challenge = challenges.find((c) => c.id === a.challengeId);
                    return (
                        <li key={a.id} className="achievements-list__item">
                            <span className="achievements-list__icon">✅</span>
                            <span>{challenge?.title ?? 'Неизвестный'}</span>
                            <span className="achievements-list__date">{a.date}</span>
                        </li>
                    );
                })}
            </ul>
        </details>
    );
}
