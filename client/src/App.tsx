import 'client/src/App.css';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthInfoProvider } from 'client/src/context/AuthInfoContext';
import { LoginPage } from 'client/src/pages/LoginPage';
import { ProtectedRoute } from 'client/src/components/route/ProtectedRoute.tsx';
import { ProfilePage } from 'client/src/pages/profile/ProfilePage.tsx';
import WavesBackground from 'client/src/components/wave-bg/WavesBackground';
import ThinWavesBackground from 'client/src/components/wave-bg/ThinWavesBackground.tsx';
import { AnimatePresence } from 'framer-motion';
import 'client/src/components/layout/layout.css';

// Компонент-обёртка для страниц
function PageWrapper({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const pageName = location.pathname.slice(1).split('/')[0] || 'home';

    return <div className={`page-${pageName}`}>{children}</div>;
}

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <>
            <div className="layout">
                <div className="layout-content">
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route
                                path="/login"
                                element={
                                    <PageWrapper>
                                        <LoginPage />
                                    </PageWrapper>
                                }
                            />
                            <Route
                                path="/profile"
                                element={
                                    <PageWrapper>
                                        <ProtectedRoute>
                                            <ProfilePage />
                                        </ProtectedRoute>
                                    </PageWrapper>
                                }
                            />
                            <Route path="/" element={<Navigate to="/login" replace />} />
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </AnimatePresence>
                </div>
            </div>

            <ThinWavesBackground />
            <WavesBackground />
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
