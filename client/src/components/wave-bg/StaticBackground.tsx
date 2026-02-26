/**
 * Статичная замена canvas-фона для пользователей с prefers-reduced-motion: reduce.
 * Цвета совпадают с градиентом ThinWavesBackground (#2c3e50 → #34495e).
 * Никаких requestAnimationFrame, никаких JS-анимаций.
 */
export function StaticBackground() {
    return (
        <div
            aria-hidden="true"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: -1,
                background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
            }}
        />
    );
}
