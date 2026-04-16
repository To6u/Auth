import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Habit, HabitLog, HabitViewMode } from '../../types';
import { Brain3DIcon } from './Brain3DIcon';
import { HabitCircle } from './HabitCircle';
import { HabitDraftCard } from './HabitDraftCard';
import { HabitModal } from './HabitModal';
import { ViewModeToggle } from './ViewModeToggle';
import './habit-board.css';

const MONTHS_RU = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
];

interface HabitBoardProps {
    habits: Habit[];
    logs: HabitLog[];
    viewMode: HabitViewMode;
    onViewModeChange: (mode: HabitViewMode) => void;
    onLogCompletion: (habitId: string, date: string) => void;
    onLogDecrement: (habitId: string, date: string) => void;
    onAddHabit: (data: Omit<Habit, 'id' | 'createdAt' | 'order'>) => void;
    onUpdateHabit: (id: string, patch: Partial<Habit>) => void;
    onDeleteHabit: (id: string) => void;
}

export function HabitBoard({
    habits,
    logs,
    viewMode,
    onViewModeChange,
    onLogCompletion,
    onLogDecrement,
    onAddHabit,
    onUpdateHabit,
    onDeleteHabit,
}: HabitBoardProps) {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [colCount, setColCount] = useState(() => {
        const saved = localStorage.getItem('habit-board-cols');
        const n = saved ? Number(saved) : 4;
        return n >= 4 && n <= 8 ? n : 4;
    });

    const updateColCount = (n: number) => {
        setColCount(n);
        localStorage.setItem('habit-board-cols', String(n));
    };
    const [showDraft, setShowDraft] = useState(false);
    const [editHabit, setEditHabit] = useState<Habit | undefined>(undefined);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<{
        habitId: string;
        x: number;
        y: number;
    } | null>(null);
    const contextRef = useRef<HTMLDivElement>(null);
    const circlesRef = useRef<HTMLDivElement>(null);

    // Фиксирует размер кружка по максимальной ширине контейнера.
    // При сужении — не пересчитывает, кружки переносятся на следующую строку.
    // При изменении colCount — maxWidth сбрасывается и считается заново.
    useEffect(() => {
        const el = circlesRef.current;
        if (!el) return;
        const GAP = 24;
        const MIN = 80;
        let maxWidth = 0;

        const update = (width: number) => {
            if (width <= maxWidth) return;
            maxWidth = width;
            const size = Math.max(MIN, Math.floor((maxWidth - GAP * (colCount - 1)) / colCount));
            el.style.setProperty('--circle-size', `${size}px`);
        };

        const ro = new ResizeObserver(([entry]) => update(entry.contentRect.width));
        ro.observe(el);
        update(el.getBoundingClientRect().width);
        return () => ro.disconnect();
    }, [colCount]);
    const todayStr = now.toISOString().split('T')[0];

    useEffect(() => {
        if (!contextMenu) return;
        const handler = (e: MouseEvent) => {
            if (contextRef.current && !contextRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [contextMenu]);

    const handleContextMenu = useCallback((e: React.MouseEvent, habitId: string) => {
        e.preventDefault();
        const mainEl = document.querySelector('.dashboard__main');
        const offset = mainEl?.getBoundingClientRect() ?? { left: 0, top: 0 };
        setContextMenu({ habitId, x: e.clientX - offset.left, y: e.clientY - offset.top });
    }, []);

    const handleLongPress = useCallback((habitId: string) => {
        setContextMenu({ habitId, x: 0, y: 0 });
    }, []);

    const handlePrev = () => {
        if (viewMode === 'month') {
            if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear((y) => y - 1);
            } else setSelectedMonth((m) => m - 1);
        } else {
            setSelectedYear((y) => y - 1);
        }
    };

    const handleNext = () => {
        if (viewMode === 'month') {
            if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear((y) => y + 1);
            } else setSelectedMonth((m) => m + 1);
        } else {
            setSelectedYear((y) => y + 1);
        }
    };

    const navLabel =
        viewMode === 'month' ? `${MONTHS_RU[selectedMonth]} ${selectedYear}` : String(selectedYear);

    const monthLogsMap = useMemo(() => {
        const map = new Map<string, HabitLog[]>();
        for (const l of logs) {
            const d = new Date(l.date);
            if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
                const arr = map.get(l.habitId) ?? [];
                arr.push(l);
                map.set(l.habitId, arr);
            }
        }
        return map;
    }, [logs, selectedYear, selectedMonth]);

    const yearLogsMap = useMemo(() => {
        const map = new Map<string, HabitLog[]>();
        for (const l of logs) {
            if (new Date(l.date).getFullYear() === selectedYear) {
                const arr = map.get(l.habitId) ?? [];
                arr.push(l);
                map.set(l.habitId, arr);
            }
        }
        return map;
    }, [logs, selectedYear]);

    const sorted = [...habits].sort((a, b) => a.order - b.order);

    return (
        <div className="habit-board">
            <div className="habit-board__header">
                <Brain3DIcon />
                <h2 className="habit-board__title">Привычки</h2>
                <button
                    type="button"
                    className="habit-board__add-btn"
                    onClick={() => setShowDraft(true)}
                    disabled={showDraft}
                >
                    <Plus size={14} />
                    Добавить
                </button>
                <div className="habit-board__col-control">
                    <span className="habit-board__col-title">Сетка</span>
                    <button
                        type="button"
                        className="habit-board__col-btn"
                        onClick={() => updateColCount(Math.max(4, colCount - 1))}
                        disabled={colCount === 4}
                        aria-label="Меньше колонок"
                    >
                        −
                    </button>
                    <span className="habit-board__col-label">{colCount}</span>
                    <button
                        type="button"
                        className="habit-board__col-btn"
                        onClick={() => updateColCount(Math.min(8, colCount + 1))}
                        disabled={colCount === 8}
                        aria-label="Больше колонок"
                    >
                        +
                    </button>
                </div>
                <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
                {viewMode !== 'today' && (
                    <div className="habit-board__nav">
                        <button type="button" className="habit-board__nav-btn" onClick={handlePrev}>
                            <ChevronLeft size={16} />
                        </button>
                        <span className="habit-board__nav-label">{navLabel}</span>
                        <button type="button" className="habit-board__nav-btn" onClick={handleNext}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            <div
                ref={circlesRef}
                className={`habit-board__circles habit-board__circles--cols-${colCount}`}
                style={{ '--habit-cols': colCount } as React.CSSProperties}
            >
                {sorted.map((habit) => {
                    const todayLog = logs.find(
                        (l) => l.habitId === habit.id && l.date === todayStr
                    );

                    return (
                        <HabitCircle
                            key={habit.id}
                            habit={habit}
                            habitId={habit.id}
                            date={todayStr}
                            log={todayLog}
                            viewMode={viewMode}
                            monthLogs={monthLogsMap.get(habit.id) ?? []}
                            yearLogs={yearLogsMap.get(habit.id) ?? []}
                            selectedMonth={selectedMonth}
                            selectedYear={selectedYear}
                            onIncrement={onLogCompletion}
                            onDecrement={onLogDecrement}
                            onContextMenu={handleContextMenu}
                            onLongPress={handleLongPress}
                        />
                    );
                })}
                {showDraft && (
                    <HabitDraftCard
                        onSave={(data) => {
                            onAddHabit(data);
                            setShowDraft(false);
                        }}
                        onCancel={() => setShowDraft(false)}
                    />
                )}
            </div>

            {contextMenu && (
                <div
                    ref={contextRef}
                    className="habit-board__context-menu"
                    style={
                        contextMenu.x
                            ? { top: contextMenu.y, left: contextMenu.x }
                            : { top: '50%', left: '50%' }
                    }
                >
                    <button
                        type="button"
                        className="habit-board__context-item"
                        onClick={() => {
                            const h = habits.find((h) => h.id === contextMenu.habitId);
                            setEditHabit(h);
                            setEditModalOpen(true);
                            setContextMenu(null);
                        }}
                    >
                        Редактировать
                    </button>
                    <button
                        type="button"
                        className="habit-board__context-item habit-board__context-item--danger"
                        onClick={() => {
                            onDeleteHabit(contextMenu.habitId);
                            setContextMenu(null);
                        }}
                    >
                        Удалить
                    </button>
                </div>
            )}

            <HabitModal
                isOpen={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false);
                    setEditHabit(undefined);
                }}
                onSave={(data) => {
                    if (editHabit) onUpdateHabit(editHabit.id, data);
                }}
                initialData={editHabit}
            />
        </div>
    );
}
