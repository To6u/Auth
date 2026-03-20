import LogoAZ from '@/components/logo/LogoAZ.tsx';

/**
 * Fallback для <Suspense> — перекрывает весь экран пока страница не готова.
 * Основной лоадер — AppLoader в App.tsx (анимация + fade-out).
 * Этот компонент — запасной сценарий при повторных Suspense-фоллбэках.
 * Фон задан через CSS-класс (App.css) чтобы PNG не попадал в initial JS-bundle.
 */
export function PageLoadingFallback() {
    return (
        <div className="page-loading-fallback">
            <LogoAZ />
        </div>
    );
}
