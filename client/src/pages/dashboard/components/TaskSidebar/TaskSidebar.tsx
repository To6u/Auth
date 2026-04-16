import { useState } from 'react';
import type { Section, Task } from '../../types';
import { DailyPlanButton } from './DailyPlanButton';
import { QuickAddTask } from './QuickAddTask';
import { SectionTabs } from './SectionTabs';
import { TaskList } from './TaskList';
import { TaskModal } from './TaskModal';
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
}: TaskSidebarProps) {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <aside className="task-sidebar glass-card">
            <SectionTabs
                sections={sections}
                activeId={activeSection}
                onChange={onSectionChange}
                onAdd={onAddSection}
                onUpdate={onUpdateSection}
                onDelete={onDeleteSection}
            />
            <div className="task-sidebar__list-wrap">
                <TaskList
                    tasks={tasks}
                    sectionId={activeSection}
                    onToggleDone={onToggleDone}
                    onTogglePin={onTogglePin}
                    onDelete={onDeleteTask}
                    onUpdate={onUpdateTask}
                    onReorder={onReorderTasks}
                />
            </div>
            <div className="task-sidebar__footer">
                <QuickAddTask
                    activeSection={activeSection}
                    onAdd={onAddTask}
                    onOpenModal={() => setModalOpen(true)}
                />
                <DailyPlanButton onCopy={onCopyDailyPlan} />
            </div>
            <TaskModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={onAddTask}
                initialSectionId={activeSection}
                sections={sections}
            />
        </aside>
    );
}
