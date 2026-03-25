import { memo, useEffect, useRef, useState } from 'react';
import { useAnimationMode } from '@/context/AnimationModeContext';
import './mode-alert.css';

const DEBOUNCE_MS = 400;
const DISMISS_MS = 3000;

export const ModeAlert = memo(() => {
    const { isSavingMode } = useAnimationMode();
    const [visible, setVisible] = useState(false);
    const [text, setText] = useState('');

    // Отслеживаем реальные изменения, а не первый рендер / StrictMode double-run
    const prevValueRef = useRef<boolean | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Инициализация — запоминаем начальное значение, алерт не показываем
        if (prevValueRef.current === null || prevValueRef.current === isSavingMode) {
            prevValueRef.current = isSavingMode;
            return;
        }
        prevValueRef.current = isSavingMode;

        // Быстрые переключения: сбрасываем таймеры, скрываем текущий алерт
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (dismissRef.current) clearTimeout(dismissRef.current);
        setVisible(false);

        // Показываем после паузы (финальное состояние серии кликов)
        debounceRef.current = setTimeout(() => {
            setText(isSavingMode ? 'Сберегающий режим' : 'Обычный режим');
            setVisible(true);

            dismissRef.current = setTimeout(() => setVisible(false), DISMISS_MS);
        }, DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (dismissRef.current) clearTimeout(dismissRef.current);
        };
    }, [isSavingMode]);

    return (
        <div
            className={`mode-alert${visible ? ' mode-alert--visible' : ''}`}
            aria-live="polite"
            aria-atomic="true"
        >
            {text}
        </div>
    );
});

ModeAlert.displayName = 'ModeAlert';
