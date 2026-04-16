import { Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import brainUrl from '@/assets/icons/brain.svg';
import type { Habit } from '../../types';
import './habit-draft-card.css';

function darkenColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `#${Math.round(r * 0.6)
        .toString(16)
        .padStart(2, '0')}${Math.round(g * 0.6)
        .toString(16)
        .padStart(2, '0')}${Math.round(b * 0.6)
        .toString(16)
        .padStart(2, '0')}`;
}

// Same constants as HabitCircle
const STROKE_WIDTH = 3;
const SEG_GAP = 8;
const VB = 200;
const CX = VB / 2;
const CY = VB / 2;
const R = 96;
const CIRC = 2 * Math.PI * R;

interface HabitDraftCardProps {
    onSave: (data: Omit<Habit, 'id' | 'createdAt' | 'order'>) => void;
    onCancel: () => void;
}

export function HabitDraftCard({ onSave, onCancel }: HabitDraftCardProps) {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#6c8fff');
    const [target, setTarget] = useState(1);
    const nameRef = useRef<HTMLInputElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);
    const filterId = 'brain-tint-draft';

    useEffect(() => {
        nameRef.current?.focus();
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onCancel]);

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({
            name: name.trim(),
            icon: '',
            color,
            overflowColor: darkenColor(color),
            targetPerDay: target,
            timeSlots: [],
            radius: 60,
        });
    };

    const segLen = CIRC / target;
    const dashLen = Math.max(segLen - SEG_GAP, 1);
    const iconSize = R * 1.1;
    const iconX = CX - iconSize / 2;
    const iconY = CY - iconSize / 2 - R * 0.15;

    return (
        <div className="habit-draft">
            {/* Same circle structure as HabitCircle */}
            <svg className="habit-draft__svg" viewBox={`0 0 ${VB} ${VB}`} aria-hidden="true">
                <defs>
                    <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
                        <feFlood floodColor={color} result="color" />
                        <feComposite in="color" in2="SourceGraphic" operator="in" />
                    </filter>
                </defs>

                {/* All segments as background (gray — no completions yet) */}
                {[...Array(target).keys()].map((i) => {
                    const offset = -(CIRC / 4) + i * segLen;
                    return (
                        <circle
                            key={`bg-${i}`}
                            cx={CX}
                            cy={CY}
                            r={R}
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth={STROKE_WIDTH}
                            strokeDasharray={`${dashLen} ${CIRC - dashLen}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                        />
                    );
                })}

                <image
                    href={brainUrl}
                    x={iconX}
                    y={iconY}
                    width={iconSize}
                    height={iconSize}
                    filter={`url(#${filterId})`}
                    opacity={0.35}
                />
            </svg>

            {/* Overlay with inputs inside the circle */}
            <div className="habit-draft__overlay">
                <input
                    ref={nameRef}
                    className="habit-draft__name-input"
                    placeholder="название"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />

                <div className="habit-draft__meta">
                    {/* Color picker */}
                    <button
                        type="button"
                        className="habit-draft__color-btn"
                        onClick={() => colorInputRef.current?.click()}
                        style={{ background: color }}
                        title="Цвет"
                    />
                    <input
                        ref={colorInputRef}
                        type="color"
                        className="habit-draft__color-input"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                    />

                    <span className="habit-draft__sep">×</span>

                    <input
                        className="habit-draft__target-input"
                        type="number"
                        min="1"
                        max="20"
                        value={target}
                        onChange={(e) => setTarget(Math.max(1, Number(e.target.value) || 1))}
                        title="Цель в день"
                    />
                </div>

                <div className="habit-draft__actions">
                    <button
                        type="button"
                        className="habit-draft__btn habit-draft__btn--save"
                        onClick={handleSave}
                        disabled={!name.trim()}
                        aria-label="Сохранить"
                    >
                        <Check size={15} />
                    </button>
                    <button
                        type="button"
                        className="habit-draft__btn habit-draft__btn--cancel"
                        onClick={onCancel}
                        aria-label="Отменить"
                    >
                        <X size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}
