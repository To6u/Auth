import {
    Bell,
    Calendar,
    Clock,
    FileText,
    FolderOpen,
    GripVertical,
    MoreVertical,
    Pencil,
    Pin,
    Plus,
    Repeat,
    Tag as TagIcon,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Recurrence, RecurrenceType, Reminders, Section, Task } from '../../types';
import { recurrenceLabel } from '../../utils/recurrence';
import './task-card.css';

type OpenField = null | 'section' | 'due' | 'est' | 'tags' | 'desc' | 'recur' | 'rem';

const todayStr = (): string => new Date().toISOString().split('T')[0];

type Draft = {
    title: string;
    description?: string;
    sectionId: string;
    tags: string[];
    dueDate?: string;
    estimatedMinutes?: number;
    recurrence?: Recurrence;
    reminders?: Reminders;
};

interface TaskCardProps {
    task: Task;
    sections: Section[];
    sectionName?: string;
    showSectionBadge: boolean;
    onToggleDone: (id: string) => void;
    onTogglePin: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, patch: Partial<Task>) => void;
    onAddNew?: (data: Omit<Task, 'id' | 'createdAt' | 'order'>) => void;
    onCancelNew?: () => void;
    isNew?: boolean;
    isDragOver: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
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

function makeDraft(task: Task): Draft {
    return {
        title: task.title,
        description: task.description,
        sectionId: task.sectionId,
        tags: task.tags,
        dueDate: task.dueDate,
        estimatedMinutes: task.estimatedMinutes,
        recurrence: task.recurrence,
        reminders: task.reminders,
    };
}

export function TaskCard({
    task,
    sections,
    sectionName,
    showSectionBadge,
    onToggleDone,
    onTogglePin,
    onDelete,
    onUpdate,
    onAddNew,
    onCancelNew,
    isNew = false,
    isDragOver,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
}: TaskCardProps) {
    const [editing, setEditing] = useState(isNew);
    const [draft, setDraft] = useState<Draft>(() => makeDraft(task));
    const [openField, setOpenField] = useState<OpenField>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

    const titleRef = useRef<HTMLTextAreaElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef(false);

    // biome-ignore lint/correctness/useExhaustiveDependencies: draft.title — триггер ресайза textarea
    useLayoutEffect(() => {
        const el = titleRef.current;
        if (!el || !editing) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, [draft.title, editing]);

    useEffect(() => {
        if (editing) titleRef.current?.focus();
    }, [editing]);

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

    const cancel = useCallback(() => {
        if (isNew) {
            onCancelNew?.();
            return;
        }
        setDraft(makeDraft(task));
        setEditing(false);
        setOpenField(null);
    }, [isNew, onCancelNew, task]);

    const commit = useCallback(() => {
        const title = draft.title.trim();
        const desc = (draft.description ?? '').trim() || undefined;
        const tagsArr = draft.tags.map((t) => t.trim()).filter(Boolean);
        const due = draft.dueDate || undefined;
        const est = draft.estimatedMinutes;
        let sec = draft.sectionId || 'all';
        if (due && due === todayStr() && sec === 'all') sec = 'today';

        if (isNew) {
            if (!title) {
                onCancelNew?.();
                return;
            }
            onAddNew?.({
                title,
                description: desc,
                sectionId: sec,
                tags: tagsArr,
                status: 'active',
                pinned: false,
                dueDate: due,
                estimatedMinutes: est,
                recurrence: draft.recurrence,
                reminders: draft.reminders,
            });
            return;
        }

        if (!title) {
            cancel();
            return;
        }

        const patch: Partial<Task> = {};
        if (title !== task.title) patch.title = title;
        if (desc !== task.description) patch.description = desc;
        if (sec !== task.sectionId) patch.sectionId = sec;
        if (JSON.stringify(tagsArr) !== JSON.stringify(task.tags)) patch.tags = tagsArr;
        if (due !== task.dueDate) patch.dueDate = due;
        if (est !== task.estimatedMinutes) patch.estimatedMinutes = est;
        if (JSON.stringify(draft.recurrence ?? null) !== JSON.stringify(task.recurrence ?? null))
            patch.recurrence = draft.recurrence;
        if (JSON.stringify(draft.reminders ?? null) !== JSON.stringify(task.reminders ?? null))
            patch.reminders = draft.reminders;

        if (Object.keys(patch).length > 0) onUpdate(task.id, patch);
        setEditing(false);
        setOpenField(null);
    }, [cancel, draft, isNew, onAddNew, onCancelNew, onUpdate, task]);

    const handleCardClick = useCallback(
        (e: React.MouseEvent) => {
            if (editing || draggingRef.current) return;
            const target = e.target as HTMLElement;
            if (
                target.closest(
                    'button, .task-card__drag, .task-card__edit-form, .task-card__meta, .task-card__subtitle, input, textarea, select'
                )
            )
                return;
            onToggleDone(task.id);
        },
        [editing, onToggleDone, task.id]
    );

    const handleMenuOpen = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuPos({ x: e.clientX, y: e.clientY });
        setMenuOpen(true);
    }, []);

    const handleDragStart = useCallback(
        (e: React.DragEvent) => {
            draggingRef.current = true;
            onDragStart(e);
        },
        [onDragStart]
    );

    const handleDragEnd = useCallback(() => {
        draggingRef.current = false;
        onDragEnd();
    }, [onDragEnd]);

    const toggleField = useCallback((f: Exclude<OpenField, null>) => {
        setOpenField((cur) => (cur === f ? null : f));
    }, []);

    const systemOptions = sections.filter((s) => s.isSystem && s.id !== 'all');
    const userSections = sections.filter((s) => !s.isSystem);
    const draftSectionLabel = sections.find((s) => s.id === draft.sectionId)?.name ?? 'Без раздела';
    const sectionAssigned = draft.sectionId !== 'all' && draft.sectionId !== '';
    const hasDraftMeta =
        sectionAssigned ||
        !!draft.dueDate ||
        !!draft.estimatedMinutes ||
        draft.tags.length > 0 ||
        !!draft.description ||
        !!draft.recurrence ||
        (draft.reminders?.times.length ?? 0) > 0;

    const classes = [
        'task-card',
        task.status === 'done' ? 'task-card--done' : '',
        task.pinned ? 'task-card--pinned' : '',
        isDragOver ? 'task-card--drag-over' : '',
        editing ? 'task-card--editing' : '',
        isNew ? 'task-card--new' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        // biome-ignore lint/a11y/useKeyWithClickEvents: карточка — drag-and-drop + click toggle; keyboard через кнопки в actions
        <li
            className={classes}
            draggable={!editing}
            onDragStart={handleDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={handleDragEnd}
            onClick={handleCardClick}
        >
            <span className="task-card__drag">
                <GripVertical size={14} />
            </span>
            <div className="task-card__body">
                {editing ? (
                    <textarea
                        ref={titleRef}
                        className="task-card__title-input"
                        rows={1}
                        value={draft.title}
                        placeholder={isNew ? 'Новая задача…' : 'Название'}
                        onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault();
                                commit();
                            }
                            if (e.key === 'Escape') {
                                e.preventDefault();
                                cancel();
                            }
                        }}
                    />
                ) : (
                    <span className="task-card__title">{task.title}</span>
                )}

                {!editing && (
                    <>
                        {(showSectionBadge ||
                            task.dueDate ||
                            task.estimatedMinutes ||
                            task.tags.length > 0 ||
                            task.recurrence ||
                            (task.reminders?.enabled &&
                                (task.reminders?.times.length ?? 0) > 0)) && (
                            <div className="task-card__meta">
                                {showSectionBadge && sectionName && (
                                    <span className="task-card__section">{sectionName}</span>
                                )}
                                {task.dueDate && (
                                    <span
                                        className={`task-card__badge ${dueDateClass(task.dueDate)}`}
                                    >
                                        {formatDueDate(task.dueDate)}
                                    </span>
                                )}
                                {task.recurrence && (
                                    <span
                                        className="task-card__badge task-card__badge--recur"
                                        title="Повторяется"
                                    >
                                        <Repeat size={10} />
                                        {recurrenceLabel(task.recurrence)}
                                    </span>
                                )}
                                {task.reminders?.enabled &&
                                    (task.reminders?.times.length ?? 0) > 0 && (
                                        <span
                                            className="task-card__badge task-card__badge--rem"
                                            title={task.reminders.times.join(', ')}
                                        >
                                            <Bell size={10} />
                                            {task.reminders.times.length}
                                        </span>
                                    )}
                                {task.estimatedMinutes && (
                                    <span className="task-card__badge">
                                        ~{task.estimatedMinutes}мин
                                    </span>
                                )}
                                {task.tags.map((tag) => (
                                    <span key={tag} className="task-card__tag">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        {task.description && (
                            <p className="task-card__subtitle">{task.description}</p>
                        )}
                    </>
                )}

                {editing && (
                    <div className="task-card__edit-form">
                        <div className="task-card__edit-icons">
                            <button
                                type="button"
                                className={`task-card__edit-icon${sectionAssigned ? ' task-card__edit-icon--active' : ''}${openField === 'section' ? ' task-card__edit-icon--open' : ''}`}
                                onClick={() => toggleField('section')}
                                title="Раздел"
                                aria-expanded={openField === 'section'}
                            >
                                <FolderOpen size={14} />
                            </button>
                            <button
                                type="button"
                                className={`task-card__edit-icon${draft.dueDate ? ' task-card__edit-icon--active' : ''}${openField === 'due' ? ' task-card__edit-icon--open' : ''}`}
                                onClick={() => toggleField('due')}
                                title="Срок"
                                aria-expanded={openField === 'due'}
                            >
                                <Calendar size={14} />
                            </button>
                            <button
                                type="button"
                                className={`task-card__edit-icon${draft.estimatedMinutes ? ' task-card__edit-icon--active' : ''}${openField === 'est' ? ' task-card__edit-icon--open' : ''}`}
                                onClick={() => toggleField('est')}
                                title="Оценка (мин)"
                                aria-expanded={openField === 'est'}
                            >
                                <Clock size={14} />
                            </button>
                            <button
                                type="button"
                                className={`task-card__edit-icon${draft.tags.length > 0 ? ' task-card__edit-icon--active' : ''}${openField === 'tags' ? ' task-card__edit-icon--open' : ''}`}
                                onClick={() => toggleField('tags')}
                                title="Теги"
                                aria-expanded={openField === 'tags'}
                            >
                                <TagIcon size={14} />
                            </button>
                            <button
                                type="button"
                                className={`task-card__edit-icon${draft.description ? ' task-card__edit-icon--active' : ''}${openField === 'desc' ? ' task-card__edit-icon--open' : ''}`}
                                onClick={() => toggleField('desc')}
                                title="Описание"
                                aria-expanded={openField === 'desc'}
                            >
                                <FileText size={14} />
                            </button>
                            <button
                                type="button"
                                className={`task-card__edit-icon${draft.recurrence ? ' task-card__edit-icon--active' : ''}${openField === 'recur' ? ' task-card__edit-icon--open' : ''}`}
                                onClick={() => toggleField('recur')}
                                title="Повторение"
                                aria-expanded={openField === 'recur'}
                            >
                                <Repeat size={14} />
                            </button>
                            <button
                                type="button"
                                className={`task-card__edit-icon${(draft.reminders?.times.length ?? 0) > 0 ? ' task-card__edit-icon--active' : ''}${openField === 'rem' ? ' task-card__edit-icon--open' : ''}`}
                                onClick={() => toggleField('rem')}
                                title="Напоминания"
                                aria-expanded={openField === 'rem'}
                            >
                                <Bell size={14} />
                            </button>
                        </div>

                        {openField === 'section' && (
                            <div className="task-card__edit-row">
                                <select
                                    className="task-card__edit-control"
                                    value={draft.sectionId || 'all'}
                                    onChange={(e) =>
                                        setDraft((d) => ({ ...d, sectionId: e.target.value }))
                                    }
                                >
                                    <option value="all">Без раздела</option>
                                    {systemOptions.length > 0 && (
                                        <optgroup label="Системные">
                                            {systemOptions.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                    {userSections.length > 0 && (
                                        <optgroup label="Мои разделы">
                                            {userSections.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                                {draft.sectionId !== 'all' && (
                                    <button
                                        type="button"
                                        className="task-card__edit-clear"
                                        onClick={() =>
                                            setDraft((d) => ({ ...d, sectionId: 'all' }))
                                        }
                                        title="Очистить"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        )}

                        {openField === 'due' && (
                            <div className="task-card__edit-row">
                                <input
                                    type="date"
                                    className="task-card__edit-control"
                                    value={draft.dueDate ?? ''}
                                    onChange={(e) =>
                                        setDraft((d) => ({
                                            ...d,
                                            dueDate: e.target.value || undefined,
                                        }))
                                    }
                                />
                                {draft.dueDate && (
                                    <button
                                        type="button"
                                        className="task-card__edit-clear"
                                        onClick={() =>
                                            setDraft((d) => ({ ...d, dueDate: undefined }))
                                        }
                                        title="Очистить"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        )}

                        {openField === 'est' && (
                            <div className="task-card__edit-row">
                                <input
                                    type="number"
                                    min={1}
                                    placeholder="Минут"
                                    className="task-card__edit-control"
                                    value={draft.estimatedMinutes ?? ''}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setDraft((d) => ({
                                            ...d,
                                            estimatedMinutes: v ? Number(v) : undefined,
                                        }));
                                    }}
                                />
                                {draft.estimatedMinutes !== undefined && (
                                    <button
                                        type="button"
                                        className="task-card__edit-clear"
                                        onClick={() =>
                                            setDraft((d) => ({ ...d, estimatedMinutes: undefined }))
                                        }
                                        title="Очистить"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        )}

                        {openField === 'tags' && (
                            <div className="task-card__edit-row">
                                <input
                                    type="text"
                                    placeholder="через запятую"
                                    className="task-card__edit-control"
                                    value={draft.tags.join(', ')}
                                    onChange={(e) =>
                                        setDraft((d) => ({
                                            ...d,
                                            tags: e.target.value.split(',').map((t) => t.trim()),
                                        }))
                                    }
                                />
                                {draft.tags.length > 0 && (
                                    <button
                                        type="button"
                                        className="task-card__edit-clear"
                                        onClick={() => setDraft((d) => ({ ...d, tags: [] }))}
                                        title="Очистить"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        )}

                        {openField === 'desc' && (
                            <div className="task-card__edit-row">
                                <textarea
                                    rows={2}
                                    placeholder="Описание"
                                    className="task-card__edit-control task-card__edit-control--textarea"
                                    value={draft.description ?? ''}
                                    onChange={(e) =>
                                        setDraft((d) => ({ ...d, description: e.target.value }))
                                    }
                                />
                                {draft.description && (
                                    <button
                                        type="button"
                                        className="task-card__edit-clear"
                                        onClick={() =>
                                            setDraft((d) => ({ ...d, description: undefined }))
                                        }
                                        title="Очистить"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        )}

                        {openField === 'recur' && (
                            <div className="task-card__edit-recur">
                                <div className="task-card__edit-row">
                                    <select
                                        className="task-card__edit-control"
                                        value={draft.recurrence?.type ?? ''}
                                        onChange={(e) => {
                                            const v = e.target.value as RecurrenceType | '';
                                            if (!v) {
                                                setDraft((d) => ({ ...d, recurrence: undefined }));
                                                return;
                                            }
                                            setDraft((d) => ({
                                                ...d,
                                                recurrence:
                                                    v === 'custom'
                                                        ? {
                                                              type: 'custom',
                                                              interval: d.recurrence?.interval ?? 1,
                                                              unit: d.recurrence?.unit ?? 'day',
                                                          }
                                                        : { type: v },
                                            }));
                                        }}
                                    >
                                        <option value="">Не повторять</option>
                                        <option value="daily">Каждый день</option>
                                        <option value="weekly">Каждую неделю</option>
                                        <option value="biweekly">Каждые 2 недели</option>
                                        <option value="monthly">Каждый месяц</option>
                                        <option value="yearly">Каждый год</option>
                                        <option value="custom">Кастомное…</option>
                                    </select>
                                    {draft.recurrence && (
                                        <button
                                            type="button"
                                            className="task-card__edit-clear"
                                            onClick={() =>
                                                setDraft((d) => ({ ...d, recurrence: undefined }))
                                            }
                                            title="Очистить"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                                {draft.recurrence?.type === 'custom' && (
                                    <div className="task-card__edit-row">
                                        <span className="task-card__edit-label">каждые</span>
                                        <input
                                            type="number"
                                            min={1}
                                            className="task-card__edit-control task-card__edit-control--narrow"
                                            value={draft.recurrence.interval ?? 1}
                                            onChange={(e) => {
                                                const n = Math.max(1, Number(e.target.value) || 1);
                                                setDraft((d) => ({
                                                    ...d,
                                                    recurrence: {
                                                        type: 'custom',
                                                        interval: n,
                                                        unit: d.recurrence?.unit ?? 'day',
                                                    },
                                                }));
                                            }}
                                        />
                                        <select
                                            className="task-card__edit-control"
                                            value={draft.recurrence.unit ?? 'day'}
                                            onChange={(e) => {
                                                const unit = e.target.value as
                                                    | 'day'
                                                    | 'week'
                                                    | 'month';
                                                setDraft((d) => ({
                                                    ...d,
                                                    recurrence: {
                                                        type: 'custom',
                                                        interval: d.recurrence?.interval ?? 1,
                                                        unit,
                                                    },
                                                }));
                                            }}
                                        >
                                            <option value="day">дн.</option>
                                            <option value="week">нед.</option>
                                            <option value="month">мес.</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {openField === 'rem' && (
                            <div className="task-card__edit-reminders">
                                <label className="task-card__edit-toggle">
                                    <input
                                        type="checkbox"
                                        checked={draft.reminders?.enabled ?? false}
                                        onChange={(e) =>
                                            setDraft((d) => ({
                                                ...d,
                                                reminders: {
                                                    enabled: e.target.checked,
                                                    times: d.reminders?.times ?? [],
                                                },
                                            }))
                                        }
                                    />
                                    <span>Включить напоминания</span>
                                </label>
                                {(draft.reminders?.times ?? []).map((t, idx) => (
                                    // biome-ignore lint/suspicious/noArrayIndexKey: порядок массива reminders управляется индексом, элементы не имеют стабильного id
                                    <div key={`rem-${idx}`} className="task-card__edit-row">
                                        <input
                                            type="time"
                                            className="task-card__edit-control"
                                            value={t}
                                            onChange={(e) => {
                                                const newTimes = [
                                                    ...(draft.reminders?.times ?? []),
                                                ];
                                                newTimes[idx] = e.target.value;
                                                setDraft((d) => ({
                                                    ...d,
                                                    reminders: {
                                                        enabled: d.reminders?.enabled ?? true,
                                                        times: newTimes,
                                                    },
                                                }));
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="task-card__edit-clear"
                                            onClick={() => {
                                                const newTimes = (
                                                    draft.reminders?.times ?? []
                                                ).filter((_, i) => i !== idx);
                                                setDraft((d) => ({
                                                    ...d,
                                                    reminders:
                                                        newTimes.length === 0
                                                            ? undefined
                                                            : {
                                                                  enabled:
                                                                      d.reminders?.enabled ?? true,
                                                                  times: newTimes,
                                                              },
                                                }));
                                            }}
                                            title="Удалить"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="task-card__edit-add-reminder"
                                    onClick={() => {
                                        const prev = draft.reminders?.times ?? [];
                                        setDraft((d) => ({
                                            ...d,
                                            reminders: {
                                                enabled: d.reminders?.enabled ?? true,
                                                times: [...prev, '09:00'],
                                            },
                                        }));
                                    }}
                                >
                                    <Plus size={12} />
                                    <span>Добавить напоминание</span>
                                </button>
                            </div>
                        )}

                        {!openField && hasDraftMeta && (
                            <div className="task-card__meta task-card__meta--edit">
                                {sectionAssigned && (
                                    <span className="task-card__section">{draftSectionLabel}</span>
                                )}
                                {draft.dueDate && (
                                    <span
                                        className={`task-card__badge ${dueDateClass(draft.dueDate)}`}
                                    >
                                        {formatDueDate(draft.dueDate)}
                                    </span>
                                )}
                                {draft.recurrence && (
                                    <span className="task-card__badge task-card__badge--recur">
                                        <Repeat size={10} />
                                        {recurrenceLabel(draft.recurrence)}
                                    </span>
                                )}
                                {(draft.reminders?.times.length ?? 0) > 0 && (
                                    <span className="task-card__badge task-card__badge--rem">
                                        <Bell size={10} />
                                        {draft.reminders?.times.length}
                                    </span>
                                )}
                                {draft.estimatedMinutes && (
                                    <span className="task-card__badge">
                                        ~{draft.estimatedMinutes}мин
                                    </span>
                                )}
                                {draft.tags.map((tag) => (
                                    <span key={tag} className="task-card__tag">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="task-card__edit-actions">
                            <button
                                type="button"
                                className="task-card__edit-btn task-card__edit-btn--cancel"
                                onClick={cancel}
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                className="task-card__edit-btn task-card__edit-btn--save"
                                onClick={commit}
                            >
                                {isNew ? 'Создать' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {!editing && (
                <div className="task-card__actions">
                    <button
                        type="button"
                        className="task-card__action-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditing(true);
                        }}
                        title="Редактировать"
                    >
                        <Pencil size={12} />
                    </button>
                    <button
                        type="button"
                        className={`task-card__action-btn${task.pinned ? ' task-card__action-btn--active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(task.id);
                        }}
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
            )}
            {menuOpen &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="task-card__context-menu"
                        style={{ top: menuPos.y, left: menuPos.x }}
                    >
                        <button
                            type="button"
                            className="task-card__context-item"
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditing(true);
                                setMenuOpen(false);
                            }}
                        >
                            Редактировать
                        </button>
                        <button
                            type="button"
                            className="task-card__context-item"
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpdate(task.id, { status: 'archived' });
                                setMenuOpen(false);
                            }}
                        >
                            Архивировать
                        </button>
                        <button
                            type="button"
                            className="task-card__context-item task-card__context-item--danger"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(task.id);
                                setMenuOpen(false);
                            }}
                        >
                            Удалить
                        </button>
                    </div>,
                    document.body
                )}
        </li>
    );
}
