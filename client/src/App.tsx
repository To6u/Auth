import 'client/src/App.css';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthInfoProvider } from 'client/src/context/AuthInfoContext';
import { LoginPage } from 'client/src/pages/LoginPage';
import { ProtectedRoute } from 'client/src/components/route/ProtectedRoute.tsx';
import WavesBackground from 'client/src/components/wave-bg/WavesBackground';
import ThinWavesBackground from '@/components/wave-bg/thin-wave/ThinWavesBackground.tsx';
import { AnimatePresence } from 'framer-motion';
import 'client/src/components/layout/layout.css';
import WavesWithText from '@/components/wave-bg/wave-with-text/WavesWithText.tsx';
import * as React from 'react';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/error-boundary/ErrorBoundary.tsx';
import { PageErrorFallback } from '@/components/error-boundary/PageErrorFallback.tsx';
import { PageLoadingFallback } from '@/components/error-boundary/PageLoadingFallback.tsx';
import { StaticBackground } from '@/components/wave-bg/StaticBackground.tsx';
import { useMotionPreference } from '@/hooks/useMotionPreference.ts';

// ProfilePage загружается лениво — не попадает в initial bundle страницы логина
const ProfilePage = lazy(() =>
    import('@/pages/profile/ProfilePage.tsx').then((m) => ({ default: m.ProfilePage }))
);

// Компонент-обёртка для страниц
function PageWrapper({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const pageName = location.pathname.slice(1).split('/')[0] || 'home';

    return <div className={`page-${pageName}`}>{children}</div>;
}

function AnimatedRoutes() {
    const location = useLocation();
    const { prefersReducedMotion, isMobile } = useMotionPreference();

    return (
        <>
            <div className="layout">
                <div className="layout-content">
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route
                                path="/login"
                                element={
                                    <ErrorBoundary fallback={<PageErrorFallback />} name="LoginPage">
                                        <PageWrapper>
                                            <LoginPage />
                                        </PageWrapper>
                                    </ErrorBoundary>
                                }
                            />
                            <Route
                                path="/profile"
                                element={
                                    <ErrorBoundary fallback={<PageErrorFallback />} name="ProfilePage">
                                        <Suspense fallback={<PageLoadingFallback />}>
                                            <PageWrapper>
                                                <ProtectedRoute>
                                                    <ProfilePage />
                                                </ProtectedRoute>
                                            </PageWrapper>
                                        </Suspense>
                                    </ErrorBoundary>
                                }
                            />
                            <Route path="/" element={<Navigate to="/login" replace />} />
                            <Route path="*" element={<Navigate to="/login" replace />} />
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

                    {!isMobile && (
                        <>
                            <ErrorBoundary fallback={null} name="WavesBackground">
                                <WavesBackground />
                            </ErrorBoundary>
                            <ErrorBoundary fallback={null} name="WavesWithText">
                                <WavesWithText showText={location.pathname !== '/login'} />
                            </ErrorBoundary>
                        </>
                    )}
                </>
            )}
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthInfoProvider>
                <AnimatedRoutes />
            </AuthInfoProvider>
        </BrowserRouter>
    );
}

export default App;
