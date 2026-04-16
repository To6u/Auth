import { useCallback } from 'react';
import type { Task } from '../types';

const DAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const MONTHS = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
];

function formatDate(date: Date): string {
    return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function useDailyPlan(tasks: Task[]) {
    const copyDailyPlan = useCallback(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const todayTasks = tasks.filter(
            (t) => (t.sectionId === 'today' || t.dueDate === todayStr) && t.status !== 'archived'
        );

        const lines = todayTasks.map((t) => {
            const check = t.status === 'done' ? '✅' : '⬜';
            const tags = t.tags.length > 0 ? ` [${t.tags.join(', ')}]` : '';
            const time = t.estimatedMinutes ? ` ~${t.estimatedMinutes}мин` : '';
            return `${check} ${t.title}${tags}${time}`;
        });

        const text = `📋 План на ${formatDate(today)}\n\n${lines.join('\n')}`;
        navigator.clipboard.writeText(text).catch(() => {});
    }, [tasks]);

    return { copyDailyPlan };
}
