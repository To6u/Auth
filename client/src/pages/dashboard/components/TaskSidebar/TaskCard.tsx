import { GripVertical, MoreVertical, Pin } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Task } from '../../types';
import './task-card.css';

interface TaskCardProps {
    task: Task;
    onToggleDone: (id: string) => void;
    onTogglePin: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, patch: Partial<Task>) => void;
    isDragOver: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: () => void;
    onDragEnd: () => void;
}

function dueDateClass(dueDate?: string): string {
    if (!dueDate) return '';
    const today = new Date().toISOString().split('T')[0];
    if (dueDate < today) return 'task-card__badge--overdue';
    if (dueDate === today) return 'task-card__badge--today';
    return '';
}

function formatDueDate(dueDate: string): string {
    const d = new Date(`${dueDate}T00:00:00`);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function TaskCard({
    task,
    onToggleDone,
    onTogglePin,
    onDelete,
    onUpdate,
    isDragOver,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
}: TaskCardProps) {
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(task.title);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingTitle) inputRef.current?.focus();
    }, [editingTitle]);

    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    const commitTitle = useCallback(() => {
        const trimmed = titleValue.trim();
        if (trimmed && trimmed !== task.title) onUpdate(task.id, { title: trimmed });
        else setTitleValue(task.title);
        setEditingTitle(false);
    }, [titleValue, task.id, task.title, onUpdate]);

    const handleMenuOpen = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuPos({ x: e.clientX, y: e.clientY });
        setMenuOpen(true);
    }, []);

    const classes = [
        'task-card',
        task.status === 'done' ? 'task-card--done' : '',
        task.pinned ? 'task-card--pinned' : '',
        isDragOver ? 'task-card--drag-over' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <li
            className={classes}
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
        >
            <span className="task-card__drag">
                <GripVertical size={14} />
            </span>
            <input
                type="checkbox"
                className="task-card__checkbox"
                checked={task.status === 'done'}
                onChange={() => onToggleDone(task.id)}
            />
            <div className="task-card__body">
                {editingTitle ? (
                    <input
                        ref={inputRef}
                        className="task-card__title-input"
                        value={titleValue}
                        onChange={(e) => setTitleValue(e.target.value)}
                        onBlur={commitTitle}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') commitTitle();
                            if (e.key === 'Escape') {
                                setTitleValue(task.title);
                                setEditingTitle(false);
                            }
                        }}
                    />
                ) : (
                    <button
                        type="button"
                        className="task-card__title"
                        onDoubleClick={() => setEditingTitle(true)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(true)}
                    >
                        {task.title}
                    </button>
                )}
                <div className="task-card__meta">
                    {task.dueDate && (
                        <span className={`task-card__badge ${dueDateClass(task.dueDate)}`}>
                            {formatDueDate(task.dueDate)}
                        </span>
                    )}
                    {task.estimatedMinutes && (
                        <span className="task-card__badge">~{task.estimatedMinutes}мин</span>
                    )}
                    {task.tags.map((tag) => (
                        <span key={tag} className="task-card__tag">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
            <div className="task-card__actions">
                <button
                    type="button"
                    className={`task-card__action-btn${task.pinned ? ' task-card__action-btn--active' : ''}`}
                    onClick={() => onTogglePin(task.id)}
                    title="Закрепить"
                >
                    <Pin size={12} />
                </button>
                <button
                    type="button"
                    className="task-card__action-btn"
                    onClick={handleMenuOpen}
                    title="Действия"
                >
                    <MoreVertical size={12} />
                </button>
            </div>
            {menuOpen && (
                <div
                    ref={menuRef}
                    className="task-card__context-menu"
                    style={{ position: 'fixed', top: menuPos.y, left: menuPos.x }}
                >
                    <button
                        type="button"
                        className="task-card__context-item"
                        onClick={() => {
                            setEditingTitle(true);
                            setMenuOpen(false);
                        }}
                    >
                        Редактировать
                    </button>
                    <button
                        type="button"
                        className="task-card__context-item"
                        onClick={() => {
                            onUpdate(task.id, { status: 'archived' });
                            setMenuOpen(false);
                        }}
                    >
                        Архивировать
                    </button>
                    <button
                        type="button"
                        className="task-card__context-item task-card__context-item--danger"
                        onClick={() => {
                            onDelete(task.id);
                            setMenuOpen(false);
                        }}
                    >
                        Удалить
                    </button>
                </div>
            )}
        </li>
    );
}
