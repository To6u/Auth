import { Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Section } from '../../types';

interface SectionTabsProps {
    sections: Section[];
    activeId: string;
    onChange: (id: string) => void;
    onAdd: (name: string) => void;
    onUpdate: (id: string, name: string) => void;
    onDelete: (id: string) => void;
}

export function SectionTabs({
    sections,
    activeId,
    onChange,
    onAdd,
    onUpdate,
    onDelete,
}: SectionTabsProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [addingNew, setAddingNew] = useState(false);
    const [newName, setNewName] = useState('');
    const [contextMenu, setContextMenu] = useState<{
        id: string;
        x: number;
        y: number;
    } | null>(null);
    const contextRef = useRef<HTMLDivElement>(null);

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

    const commitEdit = useCallback(
        (id: string) => {
            const trimmed = editValue.trim();
            if (trimmed) onUpdate(id, trimmed);
            setEditingId(null);
        },
        [editValue, onUpdate]
    );

    const commitAdd = useCallback(() => {
        const trimmed = newName.trim();
        if (trimmed) onAdd(trimmed);
        setAddingNew(false);
        setNewName('');
    }, [newName, onAdd]);

    const handleContextMenu = useCallback((e: React.MouseEvent, section: Section) => {
        if (section.isSystem) return;
        e.preventDefault();
        setContextMenu({ id: section.id, x: e.clientX, y: e.clientY });
    }, []);

    return (
        <div className="section-tabs">
            <div className="section-tabs__list">
                {sections.map((s) => (
                    <div key={s.id} className="section-tabs__tab-wrap">
                        {editingId === s.id ? (
                            <input
                                className="section-tabs__edit-input"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => commitEdit(s.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') commitEdit(s.id);
                                    if (e.key === 'Escape') setEditingId(null);
                                }}
                                ref={(el) => el?.focus()}
                            />
                        ) : (
                            <button
                                type="button"
                                className={`section-tabs__tab${activeId === s.id ? ' section-tabs__tab--active' : ''}`}
                                onClick={() => onChange(s.id)}
                                onDoubleClick={() => {
                                    if (!s.isSystem) {
                                        setEditingId(s.id);
                                        setEditValue(s.name);
                                    }
                                }}
                                onContextMenu={(e) => handleContextMenu(e, s)}
                            >
                                {s.name}
                            </button>
                        )}
                    </div>
                ))}
                {addingNew ? (
                    <input
                        className="section-tabs__edit-input"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={commitAdd}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') commitAdd();
                            if (e.key === 'Escape') {
                                setAddingNew(false);
                                setNewName('');
                            }
                        }}
                        placeholder="Раздел..."
                        ref={(el) => el?.focus()}
                    />
                ) : (
                    <button
                        type="button"
                        className="section-tabs__add-btn"
                        onClick={() => setAddingNew(true)}
                        title="Добавить раздел"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>
            {contextMenu && (
                <div
                    ref={contextRef}
                    className="section-tabs__context-menu"
                    style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        type="button"
                        className="section-tabs__context-item"
                        onClick={() => {
                            const s = sections.find((sec) => sec.id === contextMenu.id);
                            if (s) {
                                setEditingId(s.id);
                                setEditValue(s.name);
                            }
                            setContextMenu(null);
                        }}
                    >
                        Переименовать
                    </button>
                    <button
                        type="button"
                        className="section-tabs__context-item section-tabs__context-item--danger"
                        onClick={() => {
                            onDelete(contextMenu.id);
                            setContextMenu(null);
                        }}
                    >
                        Удалить
                    </button>
                </div>
            )}
        </div>
    );
}
