/**
 * Fallback UI для page-level ErrorBoundary.
 * Показывается когда страница выбросила необработанное исключение.
 */
export function PageErrorFallback() {
    const handleReload = () => window.location.reload();

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                color: '#fff',
                textAlign: 'center',
                padding: '24px',
                background: 'rgba(10, 8, 30, 0.92)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}
        >
            <p style={{ fontSize: '16px', opacity: 0.7, margin: 0 }}>
                Что-то пошло не так. Попробуйте перезагрузить страницу.
            </p>
            <button
                onClick={handleReload}
                style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                }}
            >
                Перезагрузить
            </button>
        </div>
    );
}
