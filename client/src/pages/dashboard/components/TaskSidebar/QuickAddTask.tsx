import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { Task } from '../../types';

interface QuickAddTaskProps {
    activeSection: string;
    onAdd: (data: Omit<Task, 'id' | 'createdAt' | 'order'>) => void;
    onOpenModal: () => void;
}

export function QuickAddTask({ activeSection, onAdd, onOpenModal }: QuickAddTaskProps) {
    const [value, setValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && value.trim()) {
            onAdd({
                title: value.trim(),
                sectionId:
                    activeSection === 'all' ||
                    activeSection === 'today' ||
                    activeSection === 'recurring'
                        ? 'all'
                        : activeSection,
                tags: [],
                status: 'active',
                pinned: false,
            });
            setValue('');
        }
    };

    return (
        <div className="quick-add-task">
            <input
                className="quick-add-task__input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Добавить задачу..."
            />
            <button
                type="button"
                className="quick-add-task__btn"
                onClick={onOpenModal}
                title="Расширенное создание"
            >
                <Plus size={16} />
            </button>
        </div>
    );
}
