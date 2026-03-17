/**
 * Fallback для <Suspense> во время lazy-загрузки страницы.
 * Намеренно минималистичный — без спиннеров и мерцания,
 * фон уже есть от canvas-компонентов.
 */
export function PageLoadingFallback() {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '14px',
            }}
        >
            Загрузка...
        </div>
    );
}
