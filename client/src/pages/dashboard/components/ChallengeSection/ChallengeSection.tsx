import { AlignLeft, Check, Plus, Settings2, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Challenge, ChallengeAssignment } from '../../types';
import { getWeekStart } from '../../utils/dateUtils';
import { AchievementsList } from './AchievementsList';
import { DailyChallengeCard } from './DailyChallengeCard';
import { Medal3DIcon } from './Medal3DIcon';
import { ShieldIcon } from './ShieldIcon';
import { WeekProgress } from './WeekProgress';
import './challenge-section.css';

interface ChallengeSectionProps {
    challenges: Challenge[];
    assignments: ChallengeAssignment[];
    onAddChallenge: (data: Omit<Challenge, 'id' | 'createdAt'>) => void;
    onUpdateChallenge: (id: string, patch: Partial<Challenge>) => void;
    onDeleteChallenge: (id: string) => void;
    onCompleteAssignment: (id: string) => void;
    onFailAssignment: (id: string) => void;
    onReactivateAssignment: (id: string) => void;
    onSwapToday: (newChallengeId: string) => void;
}

const CHIP_PALETTE = [
    {
        bg: 'rgba(180, 200, 255, 0.12)',
        border: 'rgba(180, 200, 255, 0.3)',
        text: 'rgba(190, 210, 255, 0.9)',
    },
    {
        bg: 'rgba(180, 255, 200, 0.1)',
        border: 'rgba(150, 230, 170, 0.3)',
        text: 'rgba(160, 230, 180, 0.9)',
    },
    {
        bg: 'rgba(255, 210, 180, 0.1)',
        border: 'rgba(255, 195, 155, 0.3)',
        text: 'rgba(255, 200, 160, 0.9)',
    },
    {
        bg: 'rgba(230, 180, 255, 0.1)',
        border: 'rgba(210, 160, 255, 0.3)',
        text: 'rgba(215, 170, 255, 0.9)',
    },
    {
        bg: 'rgba(255, 230, 160, 0.1)',
        border: 'rgba(255, 215, 130, 0.3)',
        text: 'rgba(255, 220, 140, 0.9)',
    },
    {
        bg: 'rgba(160, 230, 240, 0.1)',
        border: 'rgba(140, 215, 230, 0.3)',
        text: 'rgba(150, 220, 235, 0.9)',
    },
    {
        bg: 'rgba(255, 180, 200, 0.1)',
        border: 'rgba(255, 160, 185, 0.3)',
        text: 'rgba(255, 170, 195, 0.9)',
    },
] as const;

const EMOJI_PRESETS = [
    '🎯',
    '🏆',
    '🔥',
    '💪',
    '🚀',
    '🧠',
    '📚',
    '💡',
    '⚡',
    '🌟',
    '🏋️',
    '🧘',
    '🏃',
    '🚴',
    '🏊',
    '🎨',
    '🎵',
    '🎮',
    '💎',
    '🧗',
];

function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
    return (
        <div className="challenge-section__emoji-picker">
            {EMOJI_PRESETS.map((emoji) => (
                <button
                    key={emoji}
                    type="button"
                    className="challenge-section__emoji-btn"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(emoji);
                    }}
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
}

function ChallengeChip({
    challenge,
    palette,
    pastStatus,
    isTodayChallenge,
    onSwap,
    onUpdate,
    onDelete,
}: {
    challenge: Challenge;
    palette: (typeof CHIP_PALETTE)[number];
    pastStatus?: 'active' | 'done' | 'failed';
    isTodayChallenge?: boolean;
    onSwap: () => void;
    onUpdate: (patch: Partial<Challenge>) => void;
    onDelete: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [iconPickerOpen, setIconPickerOpen] = useState(false);
    const [titleDraft, setTitleDraft] = useState('');
    const [iconDraft, setIconDraft] = useState('');
    const [descDraft, setDescDraft] = useState('');
    const [descOpen, setDescOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const chipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [editing]);

    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: MouseEvent) => {
            if (chipRef.current && !chipRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    const startEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
        setTitleDraft(challenge.title);
        setIconDraft(challenge.icon ?? '');
        setDescDraft(challenge.description ?? '');
        setDescOpen(false);
        setIconPickerOpen(false);
        setEditing(true);
    };

    const commit = () => {
        const t = titleDraft.trim();
        if (!t) return;
        const patch: Partial<Challenge> = {};
        if (t !== challenge.title) patch.title = t;
        if (iconDraft !== (challenge.icon ?? '')) patch.icon = iconDraft || undefined;
        if (descDraft.trim() !== (challenge.description ?? ''))
            patch.description = descDraft.trim() || undefined;
        if (Object.keys(patch).length > 0) onUpdate(patch);
        setEditing(false);
        setDescOpen(false);
        setIconPickerOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') {
            setEditing(false);
            setDescOpen(false);
        }
    };

    // done-чип нельзя выбрать повторно; failed — можно выбрать для повтора сегодня
    const isDisabled = isTodayChallenge || pastStatus === 'done';
    const hasStatus = pastStatus !== undefined;

    return (
        // biome-ignore lint/a11y/useSemanticElements: содержит вложенные input/button — замена на <button> даёт невалидный HTML
        <div
            ref={chipRef}
            role="button"
            tabIndex={!editing && !isDisabled ? 0 : undefined}
            className={`challenge-section__swap-chip${isDisabled ? ' challenge-section__swap-chip--disabled' : ''}${editing ? ' challenge-section__swap-chip--editing' : ''}${menuOpen ? ' challenge-section__swap-chip--menu-open' : ''}`}
            style={{ background: palette.bg, borderColor: palette.border, color: palette.text }}
            data-tooltip={challenge.description || undefined}
            onClick={!editing && !isDisabled ? onSwap : undefined}
            onKeyDown={
                !editing && !isDisabled
                    ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') onSwap();
                      }
                    : undefined
            }
        >
            {!editing && hasStatus && (
                <span
                    role="img"
                    className={`challenge-section__chip-status challenge-section__chip-status--${pastStatus}`}
                    aria-label={pastStatus === 'done' ? 'Выполнен' : 'Провален'}
                >
                    {pastStatus === 'done' ? '✓' : '✕'}
                </span>
            )}

            {!editing && challenge.icon && <span aria-hidden="true">{challenge.icon}</span>}

            {editing ? (
                <>
                    <div className="challenge-section__chip-edit-row">
                        {/* Иконка слева */}
                        <div className="challenge-section__chip-icon-wrap">
                            <input
                                className="challenge-section__chip-icon-input"
                                value={iconDraft}
                                onChange={(e) => setIconDraft(e.target.value.slice(-2))}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIconPickerOpen((v) => !v);
                                }}
                                placeholder="✦"
                                readOnly
                                style={{ color: palette.text, cursor: 'pointer' }}
                            />
                            {iconPickerOpen && (
                                <EmojiPicker
                                    onSelect={(emoji) => {
                                        setIconDraft(emoji);
                                        setIconPickerOpen(false);
                                    }}
                                />
                            )}
                        </div>
                        {/* Заголовок */}
                        <input
                            ref={inputRef}
                            className="challenge-section__chip-input"
                            value={titleDraft}
                            onChange={(e) => setTitleDraft(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: palette.text }}
                        />
                        {/* Описание */}
                        <button
                            type="button"
                            className={`challenge-section__chip-desc-btn${descOpen ? ' challenge-section__chip-desc-btn--active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                                e.stopPropagation();
                                setDescOpen((v) => !v);
                            }}
                            aria-label="Описание"
                            title="Описание"
                        >
                            <AlignLeft size={10} />
                        </button>
                        {/* Подтвердить */}
                        <button
                            type="button"
                            className="challenge-section__chip-confirm"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                                e.stopPropagation();
                                commit();
                            }}
                            aria-label="Сохранить"
                        >
                            <Check size={11} />
                        </button>
                    </div>
                    {descOpen && (
                        <input
                            className="challenge-section__chip-desc-input"
                            value={descDraft}
                            onChange={(e) => setDescDraft(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setDescOpen(false);
                            }}
                            placeholder="Описание..."
                        />
                    )}
                </>
            ) : (
                <span className="challenge-section__chip-title">{challenge.title}</span>
            )}

            {!editing && (
                <button
                    type="button"
                    className="challenge-section__chip-gear"
                    onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen((v) => !v);
                    }}
                    aria-label="Настройки"
                >
                    <Settings2 size={12} />
                </button>
            )}

            {!editing && menuOpen && (
                <div className="challenge-section__chip-controls">
                    <button
                        type="button"
                        className="challenge-section__chip-btn"
                        onClick={startEdit}
                        aria-label="Редактировать"
                        title="Редактировать"
                    >
                        ✎
                    </button>
                    <button
                        type="button"
                        className="challenge-section__chip-btn challenge-section__chip-btn--danger"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        aria-label="Удалить"
                        title="Удалить"
                    >
                        <Trash2 size={11} />
                    </button>
                </div>
            )}
        </div>
    );
}

function ChallengeDraftChip({
    palette,
    onSave,
    onCancel,
}: {
    palette: (typeof CHIP_PALETTE)[number];
    onSave: (data: Omit<Challenge, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
}) {
    const [title, setTitle] = useState('');
    const [icon, setIcon] = useState('');
    const [desc, setDesc] = useState('');
    const [descOpen, setDescOpen] = useState(false);
    const [iconPickerOpen, setIconPickerOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const chipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onCancel]);

    useEffect(() => {
        if (!iconPickerOpen) return;
        const handler = (e: MouseEvent) => {
            if (chipRef.current && !chipRef.current.contains(e.target as Node)) {
                setIconPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [iconPickerOpen]);

    const save = () => {
        const t = title.trim();
        if (!t) return;
        onSave({ title: t, icon: icon || undefined, description: desc.trim() || undefined });
    };

    return (
        <div
            ref={chipRef}
            className="challenge-section__swap-chip challenge-section__swap-chip--editing"
            style={{ background: palette.bg, borderColor: palette.border, color: palette.text }}
        >
            <div className="challenge-section__chip-edit-row">
                <div className="challenge-section__chip-icon-wrap">
                    <input
                        className="challenge-section__chip-icon-input"
                        value={icon}
                        onChange={(e) => setIcon(e.target.value.slice(-2))}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIconPickerOpen((v) => !v);
                        }}
                        placeholder="✦"
                        readOnly
                        style={{ color: palette.text, cursor: 'pointer' }}
                    />
                    {iconPickerOpen && (
                        <EmojiPicker
                            onSelect={(emoji) => {
                                setIcon(emoji);
                                setIconPickerOpen(false);
                            }}
                        />
                    )}
                </div>
                <input
                    ref={inputRef}
                    className="challenge-section__chip-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') save();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Название..."
                    style={{ color: palette.text }}
                />
                <button
                    type="button"
                    className={`challenge-section__chip-desc-btn${descOpen ? ' challenge-section__chip-desc-btn--active' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                        e.stopPropagation();
                        setDescOpen((v) => !v);
                    }}
                    aria-label="Описание"
                    title="Описание"
                >
                    <AlignLeft size={10} />
                </button>
                <button
                    type="button"
                    className="challenge-section__chip-confirm"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                        e.stopPropagation();
                        save();
                    }}
                    disabled={!title.trim()}
                    aria-label="Сохранить"
                >
                    <Check size={11} />
                </button>
                <button
                    type="button"
                    className="challenge-section__chip-cancel"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onCancel();
                    }}
                    aria-label="Отменить"
                >
                    <X size={11} />
                </button>
            </div>
            {descOpen && (
                <input
                    className="challenge-section__chip-desc-input"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Описание..."
                />
            )}
        </div>
    );
}

function needsEnding(n: number): string {
    if (n === 1) return '';
    if (n >= 2 && n <= 4) return 'а';
    return 'ей';
}

export function ChallengeSection({
    challenges,
    assignments,
    onAddChallenge,
    onUpdateChallenge,
    onDeleteChallenge,
    onCompleteAssignment,
    onFailAssignment,
    onReactivateAssignment,
    onSwapToday,
}: ChallengeSectionProps) {
    const [addingNew, setAddingNew] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayStr);

    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const todayAssignment = assignments.find((a) => a.date === todayStr);
    const selectedAssignment = assignments.find((a) => a.date === selectedDate);
    const selectedChallenge = selectedAssignment
        ? challenges.find((c) => c.id === selectedAssignment.challengeId)
        : undefined;

    const weekAssignments = assignments.filter((a) => a.date >= weekStart && a.date <= weekEndStr);

    // Челленджи, использованные на других днях этой недели: challengeId → status
    const usedOnOtherDays = new Map(
        weekAssignments.filter((a) => a.date !== todayStr).map((a) => [a.challengeId, a.status])
    );
    const remaining = 7 - challenges.length;

    const completionHistory = selectedChallenge
        ? assignments.filter((a) => a.challengeId === selectedChallenge.id && a.status === 'done')
        : [];

    return (
        <div className="challenge-section">
            <div className="challenge-section__header">
                <Medal3DIcon />
                <h2 className="challenge-section__title">Челленджи</h2>
                <button
                    type="button"
                    className="challenge-section__add-btn"
                    onClick={() => setAddingNew(true)}
                >
                    <Plus size={14} />
                    Добавить
                </button>
                <WeekProgress
                    assignments={assignments}
                    selectedDate={selectedDate}
                    onDayClick={setSelectedDate}
                />
            </div>

            {selectedAssignment && selectedChallenge && (
                <div className="challenge-section__card-row">
                    <DailyChallengeCard
                        assignment={selectedAssignment}
                        challenge={selectedChallenge}
                        completionHistory={completionHistory}
                        onComplete={onCompleteAssignment}
                        onFail={onFailAssignment}
                        onUncomplete={onReactivateAssignment}
                    />
                    <div className="challenge-section__card-right">
                        <ShieldIcon variant={1} size={192} />
                    </div>
                </div>
            )}

            {challenges.length < 7 && (
                <p className="challenge-section__hint">
                    Добавь ещё {remaining} челлендж{needsEnding(remaining)} для нового пула
                </p>
            )}

            {(challenges.length > 0 || addingNew) && (
                <div className="challenge-section__swap-chips">
                    {addingNew && (
                        <ChallengeDraftChip
                            palette={CHIP_PALETTE[challenges.length % CHIP_PALETTE.length]}
                            onSave={(data) => {
                                onAddChallenge(data);
                                setAddingNew(false);
                            }}
                            onCancel={() => setAddingNew(false)}
                        />
                    )}
                    {[...challenges]
                        .sort((a, b) => {
                            const aUsed = usedOnOtherDays.has(a.id) ? 0 : 1;
                            const bUsed = usedOnOtherDays.has(b.id) ? 0 : 1;
                            return aUsed - bUsed;
                        })
                        .map((c, i) => {
                            const isTodayChallenge = todayAssignment?.challengeId === c.id;
                            const todayStatus =
                                isTodayChallenge && todayAssignment.status !== 'active'
                                    ? todayAssignment.status
                                    : undefined;
                            return (
                                <ChallengeChip
                                    key={c.id}
                                    challenge={c}
                                    palette={CHIP_PALETTE[i % CHIP_PALETTE.length]}
                                    pastStatus={todayStatus ?? usedOnOtherDays.get(c.id)}
                                    isTodayChallenge={isTodayChallenge}
                                    onSwap={() => onSwapToday(c.id)}
                                    onUpdate={(patch) => onUpdateChallenge(c.id, patch)}
                                    onDelete={() => onDeleteChallenge(c.id)}
                                />
                            );
                        })}
                </div>
            )}

            <AchievementsList assignments={assignments} challenges={challenges} />
        </div>
    );
}
