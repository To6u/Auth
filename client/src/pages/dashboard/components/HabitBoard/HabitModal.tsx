import { Check, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Habit } from '../../types';
import './habit-modal.css';

function darkenColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const dr = Math.round(r * 0.6);
    const dg = Math.round(g * 0.6);
    const db = Math.round(b * 0.6);
    return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
}

interface HabitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Habit, 'id' | 'createdAt' | 'order'>) => void;
    initialData?: Habit;
}

export function HabitModal({ isOpen, onClose, onSave, initialData }: HabitModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [name, setName] = useState('');
    const [color, setColor] = useState('#6c8fff');
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [autoOverflow, setAutoOverflow] = useState(true);
    const [overflowColor, setOverflowColor] = useState('#3a5fff');
    const [targetPerDay, setTargetPerDay] = useState('1');

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
            if (initialData) {
                setName(initialData.name);
                setColor(initialData.color);
                setOverflowColor(initialData.overflowColor);
                setAutoOverflow(false);
                setTargetPerDay(String(initialData.targetPerDay));
                setTimeSlots(initialData.timeSlots ?? []);
            } else {
                setName('');
                setColor('#6c8fff');
                setAutoOverflow(true);
                setOverflowColor('#3a5fff');
                setTargetPerDay('1');
                setTimeSlots([]);
            }
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

    useEffect(() => {
        if (autoOverflow) setOverflowColor(darkenColor(color));
    }, [color, autoOverflow]);

    const handleSave = () => {
        if (!name.trim()) return;
        const finalOverflow = autoOverflow ? darkenColor(color) : overflowColor;
        onSave({
            name: name.trim(),
            icon: '',
            color,
            overflowColor: finalOverflow,
            targetPerDay: Math.max(1, Number(targetPerDay) || 1),
            timeSlots: timeSlots.filter(Boolean),
            radius: initialData?.radius ?? 60,
        });
        onClose();
    };

    return (
        <dialog ref={dialogRef} className="habit-modal">
            <h2 className="habit-modal__title">
                {initialData ? 'Редактировать привычку' : 'Новая привычка'}
            </h2>

            <div className="habit-modal__field">
                <label htmlFor="hm-name" className="habit-modal__label">
                    Название *
                </label>
                <input
                    id="hm-name"
                    className="habit-modal__input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Название привычки"
                />
            </div>

            <div className="habit-modal__field">
                <label htmlFor="hm-color" className="habit-modal__label">
                    Цвет
                </label>
                <div className="habit-modal__color-row">
                    <input
                        id="hm-color"
                        type="color"
                        className="habit-modal__color-input"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                    />
                    <span style={{ fontSize: 12, color: 'rgba(255,244,234,0.5)' }}>основной</span>
                </div>
            </div>

            <div className="habit-modal__field">
                <label htmlFor="hm-overflow" className="habit-modal__label">
                    Цвет переполнения
                </label>
                <div className="habit-modal__color-row">
                    <input
                        id="hm-overflow"
                        type="color"
                        className="habit-modal__color-input"
                        value={overflowColor}
                        onChange={(e) => {
                            setOverflowColor(e.target.value);
                            setAutoOverflow(false);
                        }}
                        disabled={autoOverflow}
                    />
                    <label className="habit-modal__auto-label">
                        <input
                            type="checkbox"
                            checked={autoOverflow}
                            onChange={(e) => setAutoOverflow(e.target.checked)}
                        />
                        авто
                    </label>
                    <div
                        className="habit-modal__preview"
                        style={{ background: autoOverflow ? darkenColor(color) : overflowColor }}
                    />
                </div>
            </div>

            <div className="habit-modal__field">
                <label htmlFor="hm-target" className="habit-modal__label">
                    Цель в день
                </label>
                <input
                    id="hm-target"
                    className="habit-modal__input"
                    type="number"
                    min="1"
                    max="30"
                    value={targetPerDay}
                    onChange={(e) => setTargetPerDay(e.target.value)}
                    style={{ width: '80px' }}
                />
            </div>

            <div className="habit-modal__field">
                <span className="habit-modal__label">Время выполнения</span>
                {timeSlots.length > 0 && (
                    <ul className="habit-modal__slots">
                        {timeSlots.map((slot, i) => (
                            <li key={i} className="habit-modal__slot">
                                <input
                                    type="time"
                                    className="habit-modal__input habit-modal__input--time"
                                    value={slot}
                                    onChange={(e) =>
                                        setTimeSlots((prev) =>
                                            prev.map((s, idx) => (idx === i ? e.target.value : s))
                                        )
                                    }
                                />
                                <button
                                    type="button"
                                    className="habit-modal__slot-remove"
                                    onClick={() =>
                                        setTimeSlots((prev) => prev.filter((_, idx) => idx !== i))
                                    }
                                    aria-label="Удалить"
                                >
                                    <X size={14} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <button
                    type="button"
                    className="habit-modal__add-slot"
                    onClick={() => setTimeSlots((prev) => [...prev, '09:00'])}
                >
                    <Plus size={13} />
                    Добавить время
                </button>
            </div>

            <div className="habit-modal__footer">
                <button
                    type="button"
                    className="habit-modal__btn habit-modal__btn--cancel"
                    onClick={onClose}
                >
                    <X size={14} />
                    Отмена
                </button>
                <button
                    type="button"
                    className="habit-modal__btn habit-modal__btn--save"
                    onClick={handleSave}
                    disabled={!name.trim()}
                >
                    <Check size={14} />
                    Сохранить
                </button>
            </div>
        </dialog>
    );
}
