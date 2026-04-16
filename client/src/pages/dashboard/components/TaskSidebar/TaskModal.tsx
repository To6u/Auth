import { useEffect, useRef, useState } from 'react';
import type { Section, Task } from '../../types';
import './task-modal.css';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Task, 'id' | 'createdAt' | 'order'>) => void;
    initialSectionId: string;
    sections: Section[];
}

export function TaskModal({ isOpen, onClose, onSave, initialSectionId, sections }: TaskModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [sectionId, setSectionId] = useState(initialSectionId);
    const [dueDate, setDueDate] = useState('');
    const [estimatedMinutes, setEstimatedMinutes] = useState('');
    const [tagsInput, setTagsInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
            setSectionId(initialSectionId);
            setTitle('');
            setDescription('');
            setDueDate('');
            setEstimatedMinutes('');
            setTagsInput('');
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen, initialSectionId]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const handleClick = (e: MouseEvent) => {
            if (e.target === dialog) onClose();
        };
        dialog.addEventListener('click', handleClick);
        return () => dialog.removeEventListener('click', handleClick);
    }, [onClose]);

    const handleSave = () => {
        if (!title.trim()) return;
        const tags = tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        onSave({
            title: title.trim(),
            description: description.trim() || undefined,
            sectionId,
            tags,
            status: 'active',
            pinned: false,
            dueDate: dueDate || undefined,
            estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
        });
        onClose();
    };

    const userSections = sections.filter((s) => !s.isSystem || s.id === initialSectionId);

    return (
        <dialog ref={dialogRef} className="task-modal">
            <h2 className="task-modal__title">Новая задача</h2>

            <div className="task-modal__field">
                <label htmlFor="tm-title" className="task-modal__label">
                    Название *
                </label>
                <input
                    id="tm-title"
                    className="task-modal__input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    placeholder="Название задачи"
                />
            </div>

            <div className="task-modal__field">
                <label htmlFor="tm-desc" className="task-modal__label">
                    Описание
                </label>
                <textarea
                    id="tm-desc"
                    className="task-modal__textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Описание (опционально)"
                />
            </div>

            <div className="task-modal__field">
                <label htmlFor="tm-section" className="task-modal__label">
                    Раздел
                </label>
                <select
                    id="tm-section"
                    className="task-modal__select"
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                >
                    {userSections.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="task-modal__field">
                <label htmlFor="tm-due" className="task-modal__label">
                    Срок
                </label>
                <input
                    id="tm-due"
                    className="task-modal__input"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                />
            </div>

            <div className="task-modal__field">
                <label htmlFor="tm-est" className="task-modal__label">
                    Оценка (мин)
                </label>
                <input
                    id="tm-est"
                    className="task-modal__input"
                    type="number"
                    min="1"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    placeholder="30"
                />
            </div>

            <div className="task-modal__field">
                <label htmlFor="tm-tags" className="task-modal__label">
                    Теги (через запятую)
                </label>
                <input
                    id="tm-tags"
                    className="task-modal__input"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="работа, важно"
                />
            </div>

            <div className="task-modal__footer">
                <button
                    type="button"
                    className="task-modal__btn task-modal__btn--cancel"
                    onClick={onClose}
                >
                    Отмена
                </button>
                <button
                    type="button"
                    className="task-modal__btn task-modal__btn--save"
                    onClick={handleSave}
                    disabled={!title.trim()}
                >
                    Создать
                </button>
            </div>
        </dialog>
    );
}
