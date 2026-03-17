import './App.css';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthInfoProvider } from '@/context/AuthInfoContext';
import { LoginPage } from '@/pages/LoginPage';
import { ProtectedRoute } from '@/components/route/ProtectedRoute';
import WavesBackground from '@/components/wave-bg/WavesBackground';
import ThinWavesBackground from '@/components/wave-bg/thin-wave/ThinWavesBackground';
import { AnimatePresence } from 'framer-motion';
import '@/components/layout/layout.css';
import WavesWithText from '@/components/wave-bg/wave-with-text/WavesWithText.tsx';
import * as React from 'react';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/error-boundary/ErrorBoundary.tsx';
import { PageErrorFallback } from '@/components/error-boundary/PageErrorFallback.tsx';
import { PageLoadingFallback } from '@/components/error-boundary/PageLoadingFallback.tsx';
import { StaticBackground } from '@/components/wave-bg/StaticBackground.tsx';
import { useMotionPreference } from '@/hooks/useMotionPreference.ts';

// Lazy-loaded pages — не попадают в initial bundle
const ProfilePage = lazy(() =>
    import('@/pages/profile/ProfilePage.tsx').then((m) => ({ default: m.ProfilePage }))
);

const DashboardPage = lazy(() =>
    import('@/pages/dashboard/DashboardPage.tsx').then((m) => ({ default: m.DashboardPage }))
);

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
                                    <ErrorBoundary fallback={<PageErrorFallback />} name="ProfilePage">
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
                                    <ErrorBoundary fallback={<PageErrorFallback />} name="LoginPage">
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
                                    <ErrorBoundary fallback={<PageErrorFallback />} name="DashboardPage">
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

                    <ErrorBoundary fallback={null} name="WavesBackground">
                        <WavesBackground />
                    </ErrorBoundary>

                    <ErrorBoundary fallback={null} name="WavesWithText">
                        <WavesWithText
                            showText={location.pathname !== '/login'}
                            isStatic={isTabletOrMobile}
                        />
                    </ErrorBoundary>
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
