import type { Recurrence } from '../types';

function toISODate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function nextOccurrence(base: string, recurrence: Recurrence): string {
    const d = new Date(`${base}T00:00:00`);
    switch (recurrence.type) {
        case 'daily':
            d.setDate(d.getDate() + 1);
            break;
        case 'weekly':
            d.setDate(d.getDate() + 7);
            break;
        case 'biweekly':
            d.setDate(d.getDate() + 14);
            break;
        case 'monthly':
            d.setMonth(d.getMonth() + 1);
            break;
        case 'yearly':
            d.setFullYear(d.getFullYear() + 1);
            break;
        case 'custom': {
            const n = Math.max(1, recurrence.interval ?? 1);
            const unit = recurrence.unit ?? 'day';
            if (unit === 'day') d.setDate(d.getDate() + n);
            else if (unit === 'week') d.setDate(d.getDate() + n * 7);
            else d.setMonth(d.getMonth() + n);
            break;
        }
    }
    return toISODate(d);
}

export function todayISO(): string {
    return toISODate(new Date());
}

export function recurrenceLabel(r: Recurrence): string {
    switch (r.type) {
        case 'daily':
            return 'каждый день';
        case 'weekly':
            return 'каждую неделю';
        case 'biweekly':
            return 'каждые 2 недели';
        case 'monthly':
            return 'каждый месяц';
        case 'yearly':
            return 'каждый год';
        case 'custom': {
            const n = r.interval ?? 1;
            const unit = r.unit ?? 'day';
            const map = {
                day: n === 1 ? 'день' : 'дней',
                week: n === 1 ? 'неделю' : 'недель',
                month: n === 1 ? 'месяц' : 'месяцев',
            };
            return n === 1 ? `каждый ${map[unit]}` : `каждые ${n} ${map[unit]}`;
        }
    }
}
