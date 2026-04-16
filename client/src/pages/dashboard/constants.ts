import type { Section } from './types';

export const SYSTEM_SECTIONS: Section[] = [
    { id: 'all', name: 'Все', order: 0, isSystem: true },
    { id: 'today', name: 'Сегодня', order: 1, isSystem: true },
    { id: 'recurring', name: 'Повторяющиеся', order: 2, isSystem: true },
    { id: 'profile', name: 'Профиль', order: 3, isSystem: true },
];
