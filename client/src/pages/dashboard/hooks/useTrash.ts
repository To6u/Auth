import { useCallback, useEffect, useState } from 'react';
import { IS_DEMO } from '../demoData';
import type { TrashItem } from '../types';

export function useTrash(onRestored?: () => void) {
    const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (IS_DEMO) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        async function load() {
            try {
                const res = await fetch('/api/trash', { credentials: 'include' });
                if (!res.ok) throw new Error('Ошибка загрузки корзины');
                const data = (await res.json()) as TrashItem[];
                if (!cancelled) setTrashItems(data);
            } catch {
                // silent — корзина не критична
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    const addToTrash = useCallback(
        async (item: TrashItem) => {
            const prev = trashItems;
            setTrashItems((cur) => [...cur, item]);
            if (IS_DEMO) return;

            try {
                const res = await fetch('/api/trash', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: item.id,
                        type: item.type,
                        data: item.data,
                        deletedAt: item.deletedAt,
                        expiresAt: item.expiresAt,
                    }),
                });
                if (!res.ok) throw new Error('Ошибка добавления в корзину');
            } catch {
                setTrashItems(prev);
            }
        },
        [trashItems]
    );

    const restoreItem = useCallback(
        async (id: string) => {
            const prev = trashItems;
            setTrashItems((cur) => cur.filter((i) => i.id !== id));
            if (IS_DEMO) {
                onRestored?.();
                return;
            }

            try {
                const res = await fetch(`/api/trash/${id}/restore`, {
                    method: 'POST',
                    credentials: 'include',
                });
                if (!res.ok) throw new Error('Ошибка восстановления');
                onRestored?.();
            } catch {
                setTrashItems(prev);
            }
        },
        [trashItems, onRestored]
    );

    const permanentDelete = useCallback(
        async (id: string) => {
            const prev = trashItems;
            setTrashItems((cur) => cur.filter((i) => i.id !== id));
            if (IS_DEMO) return;

            try {
                const res = await fetch(`/api/trash/${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
                if (!res.ok) throw new Error('Ошибка удаления из корзины');
            } catch {
                setTrashItems(prev);
            }
        },
        [trashItems]
    );

    return {
        trashItems,
        loading,
        addToTrash,
        restoreItem,
        permanentDelete,
    };
}
