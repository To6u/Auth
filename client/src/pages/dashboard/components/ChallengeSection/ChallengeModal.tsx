import { useEffect, useRef, useState } from 'react';
import type { Challenge } from '../../types';

interface ChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Challenge, 'id' | 'createdAt'>) => void;
    initialData?: Challenge;
}

export function ChallengeModal({ isOpen, onClose, onSave, initialData }: ChallengeModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('');

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
            setTitle(initialData?.title ?? '');
            setDescription(initialData?.description ?? '');
            setIcon(initialData?.icon ?? '');
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const handler = (e: MouseEvent) => {
            if (e.target === dialog) onClose();
        };
        dialog.addEventListener('click', handler);
        return () => dialog.removeEventListener('click', handler);
    }, [onClose]);

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({
            title: title.trim(),
            description: description.trim() || undefined,
            icon: icon.trim() || undefined,
        });
        onClose();
    };

    return (
        <dialog ref={dialogRef} className="challenge-modal">
            <h2 className="challenge-modal__title">
                {initialData ? 'Редактировать челлендж' : 'Новый челлендж'}
            </h2>
            <div className="challenge-modal__field">
                <label htmlFor="cm-title" className="challenge-modal__label">
                    Название *
                </label>
                <input
                    id="cm-title"
                    className="challenge-modal__input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    placeholder="Название челленджа"
                />
            </div>
            <div className="challenge-modal__field">
                <label htmlFor="cm-desc" className="challenge-modal__label">
                    Описание
                </label>
                <textarea
                    id="cm-desc"
                    className="challenge-modal__textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Описание (опционально)"
                />
            </div>
            <div className="challenge-modal__field">
                <label htmlFor="cm-icon" className="challenge-modal__label">
                    Иконка (emoji)
                </label>
                <input
                    id="cm-icon"
                    className="challenge-modal__input challenge-modal__input--icon"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="🏃"
                    maxLength={2}
                />
            </div>
            <div className="challenge-modal__footer">
                <button
                    type="button"
                    className="challenge-modal__btn challenge-modal__btn--cancel"
                    onClick={onClose}
                >
                    Отмена
                </button>
                <button
                    type="button"
                    className="challenge-modal__btn challenge-modal__btn--save"
                    onClick={handleSave}
                    disabled={!title.trim()}
                >
                    Сохранить
                </button>
            </div>
        </dialog>
    );
}
