import { Plus } from 'lucide-react';

interface QuickAddTaskProps {
    onTrigger: () => void;
    disabled?: boolean;
}

export function QuickAddTask({ onTrigger, disabled }: QuickAddTaskProps) {
    return (
        <button type="button" className="quick-add-task" onClick={onTrigger} disabled={disabled}>
            <Plus size={16} />
            <span>Добавить задачу</span>
        </button>
    );
}
