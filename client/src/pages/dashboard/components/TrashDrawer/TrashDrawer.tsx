import { Activity, CheckSquare, Trophy, X } from 'lucide-react';
import { useEffect } from 'react';
import type { TrashItem } from '../../types';
import './trash-drawer.css';

interface TrashDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    trashItems: TrashItem[];
    onRestore: (id: string) => void;
    onPermanentDelete: (id: string) => void;
}

const TYPE_ICONS = {
    task: CheckSquare,
    habit: Activity,
    challenge: Trophy,
};

const SECTION_LABELS: Record<TrashItem['type'], string> = {
    task: 'Задачи',
    habit: 'Привычки',
    challenge: 'Челленджи',
};

const SECTION_ORDER: TrashItem['type'][] = ['task', 'habit', 'challenge'];

function getItemName(item: TrashItem): string {
    if (item.type === 'task') return (item.data as { title: string }).title;
    if (item.type === 'habit') return (item.data as { name: string }).name;
    return (item.data as { title: string }).title;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function TrashItemRow({
    item,
    onRestore,
    onPermanentDelete,
}: {
    item: TrashItem;
    onRestore: (id: string) => void;
    onPermanentDelete: (id: string) => void;
}) {
    const Icon = TYPE_ICONS[item.type];
    return (
        <div className="trash-item">
            <span className="trash-item__icon">
                <Icon size={14} />
            </span>
            <div className="trash-item__body">
                <p className="trash-item__name">{getItemName(item)}</p>
                <p className="trash-item__meta">
                    Удалено: {formatDate(item.deletedAt)} · Истекает: {formatDate(item.expiresAt)}
                </p>
            </div>
            <div className="trash-item__actions">
                <button
                    type="button"
                    className="trash-item__btn trash-item__btn--restore"
                    onClick={() => onRestore(item.id)}
                >
                    Восстановить
                </button>
                <button
                    type="button"
                    className="trash-item__btn trash-item__btn--delete"
                    onClick={() => onPermanentDelete(item.id)}
                >
                    Удалить
                </button>
            </div>
        </div>
    );
}

export function TrashDrawer({
    isOpen,
    onClose,
    trashItems,
    onRestore,
    onPermanentDelete,
}: TrashDrawerProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    return (
        <>
            {isOpen && (
                <div className="trash-drawer__backdrop" onClick={onClose} aria-hidden="true" />
            )}
            <div className={`trash-drawer${isOpen ? ' trash-drawer--open' : ''}`}>
                <div className="trash-drawer__header">
                    <h2 className="trash-drawer__title">Корзина</h2>
                    <button type="button" className="trash-drawer__close-btn" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>
                <div className="trash-drawer__list">
                    {trashItems.length === 0 ? (
                        <p className="trash-drawer__empty">Корзина пуста</p>
                    ) : (
                        SECTION_ORDER.map((type) => {
                            const group = trashItems.filter((i) => i.type === type);
                            if (group.length === 0) return null;
                            return (
                                <div key={type} className="trash-drawer__section">
                                    <h3 className="trash-drawer__section-title">
                                        {SECTION_LABELS[type]}
                                    </h3>
                                    {group.map((item) => (
                                        <TrashItemRow
                                            key={item.id}
                                            item={item}
                                            onRestore={onRestore}
                                            onPermanentDelete={onPermanentDelete}
                                        />
                                    ))}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
}
