import './App.css';
import { AnimatePresence } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '@/components/route/ProtectedRoute';
import ThinWavesBackground from '@/components/wave-bg/thin-wave/ThinWavesBackground';
import WavesBackground from '@/components/wave-bg/WavesBackground';
import { AnimationModeProvider } from '@/context/AnimationModeContext';
import { AuthInfoProvider } from '@/context/AuthInfoContext';
import { LoginPage } from '@/pages/LoginPage';
import '@/components/layout/layout.css';
import type * as React from 'react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from '@/components/error-boundary/ErrorBoundary.tsx';
import { PageErrorFallback } from '@/components/error-boundary/PageErrorFallback.tsx';
import { PageLoadingFallback } from '@/components/error-boundary/PageLoadingFallback.tsx';
import { StaticBackground } from '@/components/wave-bg/StaticBackground.tsx';
import WavesWithText from '@/components/wave-bg/wave-with-text/WavesWithText.tsx';
import { useMotionPreference } from '@/hooks/useMotionPreference.ts';
import LogoAZ from '@/components/logo/LogoAZ.tsx';

// Запускаем загрузку модуля сразу — чтобы AppLoader мог отследить готовность
const _profileModulePromise = import('@/pages/profile/ProfilePage.tsx');
// Флаг: показывать loader только при первом входе в сессии.
// Module-level — сбрасывается только при полной перезагрузке страницы (не SPA-навигации).
// В dev при HMR App.tsx сбрасывается автоматически; если нет — открой DevTools и сделай hard reload.
let _loaderDone = false;

// Lazy-loaded pages — не попадают в initial bundle
const ProfilePage = lazy(() => _profileModulePromise.then((m) => ({ default: m.ProfilePage })));

const DashboardPage = lazy(() =>
    import('@/pages/dashboard/DashboardPage.tsx').then((m) => ({ default: m.DashboardPage }))
);

/**
 * Полноэкранный overlay с лого-анимацией.
 * Исчезает ТОЛЬКО по окончании полного цикла анимации (animationiteration)
 * при условии что модуль страницы уже загружен.
 */
function AppLoader() {
    const [fading, setFading] = useState(false);
    const [gone, setGone] = useState(_loaderDone);
    const state = useRef({ moduleReady: false, animationDone: false, fading: false });

    const triggerFade = useCallback(() => {
        if (!state.current.fading) {
            state.current.fading = true;
            setFading(true);
            setTimeout(() => {
                _loaderDone = true;
                setGone(true);
            }, 900);
        }
    }, []);

    useEffect(() => {
        _profileModulePromise.then(() => {
            state.current.moduleReady = true;
            // Модуль загрузился после окончания анимации — запускаем сразу
            if (state.current.animationDone) triggerFade();
        });
    }, [triggerFade]);

    const handleTransitionEnd = useCallback(() => {
        _loaderDone = true;
        setGone(true);
    }, []);

    const handleAnimationEnd = useCallback(() => {
        state.current.animationDone = true;
        // Анимация закончилась и модуль уже готов — запускаем сразу
        if (state.current.moduleReady) triggerFade();
    }, [triggerFade]);

    if (gone) return null;

    return (
        <div
            className="app-loader"
            style={{
                opacity: fading ? 0 : 1,
                transition: fading ? 'opacity 0.8s ease' : 'none',
            }}
            onTransitionEnd={handleTransitionEnd}
        >
            <LogoAZ fading={fading} onAnimationEnd={handleAnimationEnd} />
        </div>
    );
}

// Компонент-обёртка для страниц
function PageWrapper({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const pageName = location.pathname.slice(1).split('/')[0] || 'home';

    return <div className={`page-${pageName}`}>{children}</div>;
}

function AnimatedRoutes() {
    const location = useLocation();
    const { prefersReducedMotion, isTabletOrMobile } = useMotionPreference();

    return (
        <>
            <div className="layout">
                <div className="layout-content">
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            {/* Public portfolio page */}
                            <Route
                                path="/"
                                element={
                                    <ErrorBoundary
                                        fallback={<PageErrorFallback />}
                                        name="ProfilePage"
                                    >
                                        <Suspense fallback={<PageLoadingFallback />}>
                                            <PageWrapper>
                                                <ProfilePage />
                                            </PageWrapper>
                                        </Suspense>
                                    </ErrorBoundary>
                                }
                            />

                            {/* Auth page */}
                            <Route
                                path="/login"
                                element={
                                    <ErrorBoundary
                                        fallback={<PageErrorFallback />}
                                        name="LoginPage"
                                    >
                                        <PageWrapper>
                                            <LoginPage />
                                        </PageWrapper>
                                    </ErrorBoundary>
                                }
                            />

                            {/* Protected dashboard */}
                            <Route
                                path="/dashboard"
                                element={
                                    <ErrorBoundary
                                        fallback={<PageErrorFallback />}
                                        name="DashboardPage"
                                    >
                                        <Suspense fallback={<PageLoadingFallback />}>
                                            <PageWrapper>
                                                <ProtectedRoute>
                                                    <DashboardPage />
                                                </ProtectedRoute>
                                            </PageWrapper>
                                        </Suspense>
                                    </ErrorBoundary>
                                }
                            />

                            {/* Legacy /profile redirect */}
                            <Route path="/profile" element={<Navigate to="/" replace />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </AnimatePresence>
                </div>
            </div>

            {/*
             * prefers-reduced-motion: reduce → статичный CSS-градиент, 0 canvas (a11y)
             * mobile (< 768px)             → только ThinWavesBackground (фон + лёгкие волны)
             * desktop                      → все три canvas (текущее поведение)
             */}
            {prefersReducedMotion ? (
                <StaticBackground />
            ) : (
                <>
                    <ErrorBoundary fallback={null} name="ThinWavesBackground">
                        <ThinWavesBackground />
                    </ErrorBoundary>

                    {!isTabletOrMobile && (
                        <ErrorBoundary fallback={null} name="WavesBackground">
                            <WavesBackground />
                        </ErrorBoundary>
                    )}

                    {isTabletOrMobile ? (
                        <ErrorBoundary fallback={null} name="WavesWithText">
                            <WavesWithText showText={location.pathname === '/'} isStatic />
                        </ErrorBoundary>
                    ) : (
                        <ErrorBoundary fallback={null} name="WavesWithText">
                            <WavesWithText showText={location.pathname === '/'} />
                        </ErrorBoundary>
                    )}
                </>
            )}
        </>
    );
}

function App() {
    return (
        <>
            <AppLoader />
            <BrowserRouter>
                <AnimationModeProvider>
                    <AuthInfoProvider>
                        <AnimatedRoutes />
                    </AuthInfoProvider>
                </AnimationModeProvider>
            </BrowserRouter>
        </>
    );
}

export default App;
