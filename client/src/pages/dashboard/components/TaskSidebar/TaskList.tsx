import { useRef } from 'react';
import type { Section, Task } from '../../types';
import { TaskCard } from './TaskCard';

const MULTI_SECTION_TABS = new Set(['all', 'today', 'recurring']);

interface TaskListProps {
    tasks: Task[];
    sections: Section[];
    sectionId: string;
    creatingTask: Task | null;
    onToggleDone: (id: string) => void;
    onTogglePin: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, patch: Partial<Task>) => void;
    onAddNew: (data: Omit<Task, 'id' | 'createdAt' | 'order'>) => void;
    onCancelNew: () => void;
    onReorder: (sectionId: string, orderedIds: string[]) => void;
}

const noop = () => {};

export function TaskList({
    tasks,
    sections,
    sectionId,
    creatingTask,
    onToggleDone,
    onTogglePin,
    onDelete,
    onUpdate,
    onAddNew,
    onCancelNew,
    onReorder,
}: TaskListProps) {
    const draggedIdRef = useRef<string | null>(null);
    const dragOverElRef = useRef<HTMLElement | null>(null);

    const clearDragOver = () => {
        dragOverElRef.current?.removeAttribute('data-drag-over');
        dragOverElRef.current = null;
    };

    const endDrag = () => {
        draggedIdRef.current = null;
        clearDragOver();
    };

    const handleDrop = (targetId: string) => {
        const draggedId = draggedIdRef.current;
        endDrag();

        if (!draggedId || draggedId === targetId) return;

        const ids = tasks.map((t) => t.id);
        const fromIdx = ids.indexOf(draggedId);
        const toIdx = ids.indexOf(targetId);
        if (fromIdx === -1 || toIdx === -1) return;

        const pinnedCount = tasks.filter((t) => t.pinned).length;
        const draggedTask = tasks.find((t) => t.id === draggedId);
        let adjustedToIdx = toIdx;

        if (draggedTask && !draggedTask.pinned && toIdx < pinnedCount) {
            adjustedToIdx = pinnedCount;
        }

        const reordered = [...ids];
        reordered.splice(fromIdx, 1);
        reordered.splice(adjustedToIdx, 0, draggedId);

        onReorder(sectionId, reordered);
    };

    const showSectionBadgeForView = MULTI_SECTION_TABS.has(sectionId);

    const getSectionName = (id: string): string | undefined =>
        sections.find((s) => s.id === id)?.name;

    if (tasks.length === 0 && !creatingTask) {
        return <div className="task-list__empty">Нет задач</div>;
    }

    return (
        <ul className="task-list" onDragOver={(e) => e.preventDefault()}>
            {creatingTask && (
                <TaskCard
                    key="__new"
                    task={creatingTask}
                    sections={sections}
                    showSectionBadge={false}
                    isNew
                    onAddNew={onAddNew}
                    onCancelNew={onCancelNew}
                    onToggleDone={noop}
                    onTogglePin={noop}
                    onDelete={noop}
                    onUpdate={noop}
                    isDragOver={false}
                    onDragStart={noop}
                    onDragOver={noop}
                    onDrop={noop}
                    onDragEnd={noop}
                />
            )}
            {tasks.map((task) => (
                <TaskCard
                    key={task.id}
                    task={task}
                    sections={sections}
                    sectionName={getSectionName(task.sectionId)}
                    showSectionBadge={showSectionBadgeForView && task.sectionId !== 'all'}
                    onToggleDone={onToggleDone}
                    onTogglePin={onTogglePin}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                    isDragOver={false}
                    onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', task.id);
                        e.dataTransfer.effectAllowed = 'move';
                        draggedIdRef.current = task.id;
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        if (!draggedIdRef.current) return;
                        const el = e.currentTarget as HTMLElement;
                        if (dragOverElRef.current !== el) {
                            clearDragOver();
                            el.setAttribute('data-drag-over', 'true');
                            dragOverElRef.current = el;
                        }
                    }}
                    onDrop={(e) => {
                        e.stopPropagation();
                        handleDrop(task.id);
                    }}
                    onDragEnd={endDrag}
                />
            ))}
        </ul>
    );
}
