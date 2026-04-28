import { memo, useCallback, useMemo, useRef } from 'react';
import brainUrl from '@/assets/icons/brain.svg';
import type { Habit, HabitLog, HabitViewMode } from '../../types';
import './habit-circle.css';

interface HabitCircleProps {
    habit: Habit;
    habitId: string;
    date: string;
    log: HabitLog | undefined;
    viewMode: HabitViewMode;
    monthLogs?: HabitLog[];
    yearLogs?: HabitLog[];
    selectedMonth?: number;
    selectedYear?: number;
    onIncrement: (habitId: string, date: string) => void;
    onDecrement: (habitId: string, date: string) => void;
    onContextMenu: (e: React.MouseEvent, habitId: string) => void;
    onLongPress: (habitId: string) => void;
}

// Matches Skill-Group1.svg: thin ring, large icon
const STROKE_WIDTH = 3;
const SEG_GAP = 8;
const SEG_GAP_MONTH = 4;
// viewBox reference size (independent of habit.radius for uniform layout)
const VB = 200;
const CX = VB / 2;
const CY = VB / 2;
const R = 96; // ring radius — leaves 4px margin from edge with stroke
const CIRC = 2 * Math.PI * R;

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function BorderRing({ opacity }: { opacity: number }) {
    return (
        <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            style={{
                stroke: 'color-mix(in srgb, var(--habit-color) 20%, #ffffffa8)',
                transition: 'opacity 0.3s ease',
            }}
            strokeWidth={1}
            opacity={opacity}
        />
    );
}

function ColorFilter({ id, color }: { id: string; color: string }) {
    // Только тинтинг без feDropShadow — убирает Gaussian blur на GPU
    return (
        <defs>
            <filter id={id}>
                <feFlood floodColor={color} result="floodColor" />
                <feComposite in="floodColor" in2="SourceGraphic" operator="in" />
            </filter>
        </defs>
    );
}

export const HabitCircle = memo(function HabitCircle({
    habit,
    habitId,
    date,
    log,
    viewMode,
    monthLogs = [],
    yearLogs = [],
    selectedMonth,
    selectedYear,
    onIncrement,
    onDecrement,
    onContextMenu,
    onLongPress,
}: HabitCircleProps) {
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressTriggered = useRef(false);
    const filterId = `brain-tint-${habitId}`;

    // Map для month view — O(1) вместо O(n) find() в каждой итерации
    const monthLogsByDate = useMemo(() => {
        if (viewMode !== 'month') return new Map<string, HabitLog>();
        const map = new Map<string, HabitLog>();
        for (const l of monthLogs) map.set(l.date, l);
        return map;
    }, [viewMode, monthLogs]);

    const handlePointerDown = useCallback(() => {
        longPressTriggered.current = false;
        longPressTimer.current = setTimeout(() => {
            longPressTriggered.current = true;
            onLongPress(habitId);
        }, 500);
    }, [onLongPress, habitId]);

    const cancelLongPress = useCallback(() => {
        if (longPressTimer.current !== null) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleDecrement = useCallback(() => {
        if (!longPressTriggered.current) onDecrement(habitId, date);
    }, [onDecrement, habitId, date]);

    const handleIncrement = useCallback(() => {
        if (!longPressTriggered.current) onIncrement(habitId, date);
    }, [onIncrement, habitId, date]);

    // Brain icon: компактнее чтобы освободить место для текста снизу
    const iconSize = R * 0.58;
    const iconX = CX - iconSize / 2;
    const iconY = CY - iconSize / 2 - R * 0.2;

    if (viewMode === 'today') {
        const completions = log?.completions ?? 0;
        const target = habit.targetPerDay;
        const isOverflow = completions > target;
        const ringColor = isOverflow ? habit.overflowColor : habit.color;
        const filled = Math.min(completions, target);
        const segLen = CIRC / target;
        const dashLen = Math.max(segLen - SEG_GAP, 1);
        const fillRatio = Math.min(completions / target, 1);

        return (
            <div
                className="habit-circle"
                style={
                    {
                        '--habit-color': habit.color,
                        '--shadow-opacity': fillRatio,
                    } as React.CSSProperties
                }
                onContextMenu={(e) => onContextMenu(e, habitId)}
                onPointerDown={handlePointerDown}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
            >
                <svg
                    className="habit-circle__svg"
                    viewBox={`0 0 ${VB} ${VB}`}
                    aria-label={habit.name}
                >
                    <ColorFilter id={filterId} color={habit.color} />

                    {/* Background segments */}
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

                    {/* Filled segments */}
                    <g
                        className={
                            completions >= target ? 'habit-circle__ring--breathe' : undefined
                        }
                    >
                        {[...Array(filled).keys()].map((i) => {
                            const offset = -(CIRC / 4) + i * segLen;
                            return (
                                <circle
                                    key={`seg-${i}`}
                                    cx={CX}
                                    cy={CY}
                                    r={R}
                                    fill="none"
                                    stroke={ringColor}
                                    strokeWidth={STROKE_WIDTH}
                                    strokeDasharray={`${dashLen} ${CIRC - dashLen}`}
                                    strokeDashoffset={-offset}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke 0.3s ease' }}
                                />
                            );
                        })}
                    </g>

                    {/* Overflow segments */}
                    {isOverflow &&
                        [...Array(completions - target).keys()].map((i) => {
                            const offset = -(CIRC / 4) + (i % target) * segLen;
                            return (
                                <circle
                                    key={`ov-${i}`}
                                    cx={CX}
                                    cy={CY}
                                    r={R}
                                    fill="none"
                                    stroke={habit.overflowColor}
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
                        opacity={completions === 0 ? 0.2 : 1}
                        className={completions >= target ? 'habit-circle__icon--pulse' : undefined}
                        style={{ transition: 'opacity 0.3s ease' }}
                    />

                    <BorderRing opacity={fillRatio} />
                </svg>

                {completions >= target && (
                    <div
                        className="habit-circle__status"
                        style={isOverflow ? { color: '#86efac' } : undefined}
                    >
                        {isOverflow ? 'Перевыполнен' : 'Выполнено'}
                    </div>
                )}

                <div className="habit-circle__overlay">
                    <span className="habit-circle__name">{habit.name}</span>
                    <div className="habit-circle__count-display" aria-hidden="true">
                        <span className="habit-circle__count-num">{completions}</span>
                        <span className="habit-circle__count-sep">из</span>
                        <span
                            className="habit-circle__count-num"
                            style={{ opacity: Math.max(0.2, fillRatio) }}
                        >
                            {target}
                        </span>
                    </div>
                </div>

                <div
                    className={`habit-circle__half habit-circle__half--left${completions === 0 ? ' habit-circle__half--disabled' : ''}`}
                    onClick={handleDecrement}
                    role="button"
                    aria-label="Уменьшить"
                >
                    <span className="habit-circle__edge-icon">−</span>
                </div>
                <div
                    className="habit-circle__half habit-circle__half--right"
                    onClick={handleIncrement}
                    role="button"
                    aria-label="Увеличить"
                >
                    <span className="habit-circle__edge-icon">+</span>
                </div>
            </div>
        );
    }

    if (viewMode === 'month') {
        const year = selectedYear ?? new Date().getFullYear();
        const month = selectedMonth ?? new Date().getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const todayDay = new Date().getDate();
        const todayMonth = new Date().getMonth();
        const todayYear = new Date().getFullYear();
        const segLen = CIRC / daysInMonth;
        const dashLen = Math.max(segLen - SEG_GAP_MONTH, 1);
        const totalMonthCompletions = monthLogs.reduce((sum, l) => sum + l.completions, 0);
        const monthFillRatio = Math.min(
            totalMonthCompletions / (daysInMonth * habit.targetPerDay),
            1
        );

        return (
            <div
                className="habit-circle"
                style={
                    {
                        '--habit-color': habit.color,
                        '--shadow-opacity': monthFillRatio,
                    } as React.CSSProperties
                }
                onContextMenu={(e) => onContextMenu(e, habitId)}
                role="img"
                aria-label={habit.name}
            >
                <svg className="habit-circle__svg" viewBox={`0 0 ${VB} ${VB}`} aria-hidden="true">
                    <ColorFilter id={filterId} color={habit.color} />

                    {[...Array(daysInMonth).keys()].map((dayIdx) => {
                        const offset = -(CIRC / 4) + dayIdx * segLen;
                        return (
                            <circle
                                key={`bg-${dayIdx}`}
                                cx={CX}
                                cy={CY}
                                r={R}
                                fill="none"
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth={STROKE_WIDTH}
                                strokeDasharray={`${dashLen} ${CIRC - dashLen}`}
                                strokeDashoffset={-offset}
                                strokeLinecap="round"
                            />
                        );
                    })}

                    {[...Array(daysInMonth).keys()].map((dayIdx) => {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayIdx + 1).padStart(2, '0')}`;
                        const dayLog = monthLogsByDate.get(dateStr);
                        const completions = dayLog?.completions ?? 0;
                        const isToday =
                            year === todayYear && month === todayMonth && dayIdx + 1 === todayDay;
                        let segColor: string | null = null;
                        if (completions >= habit.targetPerDay) {
                            segColor = isToday ? habit.overflowColor : habit.color;
                        } else if (completions > 0) {
                            segColor = `${habit.color}80`;
                        }
                        if (!segColor) return null;
                        const offset = -(CIRC / 4) + dayIdx * segLen;
                        return (
                            <circle
                                key={`day-${dayIdx}`}
                                cx={CX}
                                cy={CY}
                                r={R}
                                fill="none"
                                stroke={segColor}
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
                    />
                    <BorderRing opacity={monthFillRatio} />
                </svg>

                <div className="habit-circle__overlay">
                    <span className="habit-circle__name">{habit.name}</span>
                    <span className="habit-circle__year-pct">{totalMonthCompletions}</span>
                </div>
            </div>
        );
    }

    // year mode
    const year = selectedYear ?? new Date().getFullYear();
    const totalTarget = habit.targetPerDay * 365;
    const totalCompletions = yearLogs.reduce((sum, l) => sum + l.completions, 0);
    const progress = Math.min(totalCompletions / totalTarget, 1);
    const filledLen = progress * CIRC;
    const pct = Math.round(progress * 100);

    return (
        <div
            className="habit-circle"
            style={
                {
                    '--habit-color': habit.color,
                    '--shadow-opacity': progress,
                } as React.CSSProperties
            }
            onContextMenu={(e) => onContextMenu(e, habitId)}
            role="img"
            aria-label={`${habit.name} ${pct}%`}
        >
            <svg className="habit-circle__svg" viewBox={`0 0 ${VB} ${VB}`} aria-hidden="true">
                <ColorFilter id={filterId} color={habit.color} />

                <circle
                    cx={CX}
                    cy={CY}
                    r={R}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={STROKE_WIDTH}
                    strokeLinecap="round"
                />
                <circle
                    cx={CX}
                    cy={CY}
                    r={R}
                    fill="none"
                    stroke={habit.color}
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={`${filledLen} ${CIRC - filledLen}`}
                    strokeDashoffset={CIRC / 4}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.4s ease' }}
                />

                <image
                    href={brainUrl}
                    x={iconX}
                    y={iconY}
                    width={iconSize}
                    height={iconSize}
                    filter={`url(#${filterId})`}
                />
                <BorderRing opacity={progress} />
            </svg>

            <div className="habit-circle__overlay">
                <span className="habit-circle__name">{habit.name}</span>
                <span className="habit-circle__year-pct">
                    {pct}% · {year}
                </span>
            </div>
        </div>
    );
});
HabitCircle.displayName = 'HabitCircle';
