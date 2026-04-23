import { ArrowDownWideNarrow, ListChecks } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { Section, Task } from '../../types';
import { DailyPlanButton } from './DailyPlanButton';
import { QuickAddTask } from './QuickAddTask';
import { SectionTabs } from './SectionTabs';
import { TaskList } from './TaskList';
import './task-sidebar.css';

interface TaskSidebarProps {
    sections: Section[];
    activeSection: string;
    onSectionChange: (id: string) => void;
    tasks: Task[];
    onToggleDone: (id: string) => void;
    onTogglePin: (id: string) => void;
    onDeleteTask: (id: string) => void;
    onUpdateTask: (id: string, patch: Partial<Task>) => void;
    onAddTask: (data: Omit<Task, 'id' | 'createdAt' | 'order'>) => void;
    onAddSection: (name: string) => void;
    onUpdateSection: (id: string, name: string) => void;
    onDeleteSection: (id: string) => void;
    onReorderTasks: (sectionId: string, orderedIds: string[]) => void;
    onCopyDailyPlan: () => void;
    doneAtBottom: boolean;
    onToggleDoneAtBottom: () => void;
}

const VIRTUAL_TABS = new Set(['all', 'today', 'recurring']);

function buildDraft(activeSection: string): Task {
    const defaultSection = VIRTUAL_TABS.has(activeSection) ? 'all' : activeSection;
    return {
        id: '__new__',
        title: '',
        sectionId: defaultSection,
        tags: [],
        status: 'active',
        pinned: false,
        order: 0,
        createdAt: new Date().toISOString(),
    };
}

export function TaskSidebar({
    sections,
    activeSection,
    onSectionChange,
    tasks,
    onToggleDone,
    onTogglePin,
    onDeleteTask,
    onUpdateTask,
    onAddTask,
    onAddSection,
    onUpdateSection,
    onDeleteSection,
    onReorderTasks,
    onCopyDailyPlan,
    doneAtBottom,
    onToggleDoneAtBottom,
}: TaskSidebarProps) {
    const [creating, setCreating] = useState<Task | null>(null);

    const handleStartCreating = useCallback(() => {
        setCreating(buildDraft(activeSection));
    }, [activeSection]);

    const handleCancelCreating = useCallback(() => {
        setCreating(null);
    }, []);

    const handleAddFromDraft = useCallback(
        (data: Omit<Task, 'id' | 'createdAt' | 'order'>) => {
            onAddTask(data);
            setCreating(null);
        },
        [onAddTask]
    );

    const handleSectionChange = useCallback(
        (id: string) => {
            setCreating(null);
            onSectionChange(id);
        },
        [onSectionChange]
    );

    return (
        <aside className="task-sidebar">
            <h2>Задачи</h2>
            <SectionTabs
                sections={sections}
                activeId={activeSection}
                onChange={handleSectionChange}
                onAdd={onAddSection}
                onUpdate={onUpdateSection}
                onDelete={onDeleteSection}
            />
            <button
                type="button"
                className={`task-sidebar__sort-toggle${doneAtBottom ? ' task-sidebar__sort-toggle--active' : ''}`}
                onClick={onToggleDoneAtBottom}
                title="Сортировка выполненных задач"
            >
                {doneAtBottom ? <ArrowDownWideNarrow size={12} /> : <ListChecks size={12} />}
                <span>Выполненные: {doneAtBottom ? 'в конце' : 'на местах'}</span>
            </button>
            <div className="task-sidebar__list-wrap">
                <TaskList
                    tasks={tasks}
                    sections={sections}
                    sectionId={activeSection}
                    creatingTask={creating}
                    onToggleDone={onToggleDone}
                    onTogglePin={onTogglePin}
                    onDelete={onDeleteTask}
                    onUpdate={onUpdateTask}
                    onAddNew={handleAddFromDraft}
                    onCancelNew={handleCancelCreating}
                    onReorder={onReorderTasks}
                />
            </div>
            <div className="task-sidebar__footer">
                <QuickAddTask onTrigger={handleStartCreating} disabled={!!creating} />
                <DailyPlanButton onCopy={onCopyDailyPlan} />
            </div>
        </aside>
    );
}
