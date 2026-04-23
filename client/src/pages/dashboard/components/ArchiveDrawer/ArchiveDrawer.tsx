import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { Section, Task } from '../../types';
import './archive-drawer.css';

interface ArchiveDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    sections: Section[];
    onRestore: (id: string) => void;
    onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function ArchiveDrawer({
    isOpen,
    onClose,
    tasks,
    sections,
    onRestore,
    onDelete,
}: ArchiveDrawerProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    const getSectionName = (id: string): string | undefined =>
        sections.find((s) => s.id === id)?.name;

    return (
        <>
            {isOpen && (
                <div className="archive-drawer__backdrop" onClick={onClose} aria-hidden="true" />
            )}
            <div className={`archive-drawer${isOpen ? ' archive-drawer--open' : ''}`}>
                <div className="archive-drawer__header">
                    <h2 className="archive-drawer__title">Архив</h2>
                    <button type="button" className="archive-drawer__close-btn" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>
                <div className="archive-drawer__list">
                    {tasks.length === 0 ? (
                        <p className="archive-drawer__empty">Архив пуст</p>
                    ) : (
                        tasks.map((task) => {
                            const sectionName = getSectionName(task.sectionId);
                            const isSystemSection = [
                                'all',
                                'today',
                                'recurring',
                                'profile',
                            ].includes(task.sectionId);
                            return (
                                <div key={task.id} className="archive-item">
                                    <div className="archive-item__body">
                                        <p className="archive-item__name">{task.title}</p>
                                        <p className="archive-item__meta">
                                            {task.completedAt && (
                                                <>Завершено: {formatDate(task.completedAt)}</>
                                            )}
                                            {!task.completedAt && (
                                                <>Создано: {formatDate(task.createdAt)}</>
                                            )}
                                        </p>
                                        {sectionName && !isSystemSection && (
                                            <span className="archive-item__section">
                                                {sectionName}
                                            </span>
                                        )}
                                    </div>
                                    <div className="archive-item__actions">
                                        <button
                                            type="button"
                                            className="archive-item__btn archive-item__btn--restore"
                                            onClick={() => onRestore(task.id)}
                                        >
                                            Восстановить
                                        </button>
                                        <button
                                            type="button"
                                            className="archive-item__btn archive-item__btn--delete"
                                            onClick={() => onDelete(task.id)}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
}
