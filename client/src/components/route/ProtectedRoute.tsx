import { useAuthInfo } from 'client/src/hooks/useAuthInfo';
import { useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuthInfo();
    const navigate = useNavigate();
    const wasAuthRef = useRef(false);

    // Запоминаем что пользователь был аутентифицирован в этом маунте
    useEffect(() => {
        if (isAuthenticated) wasAuthRef.current = true;
    }, [isAuthenticated]);

    // При логауте — navigate через effect, а не рендер.
    // Это позволяет AnimatedPageWrapper доиграть exit-анимацию до анмаунта.
    useEffect(() => {
        if (!isLoading && !isAuthenticated && wasAuthRef.current) {
            navigate('/login', { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);

    if (isLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                Загрузка...
            </div>
        );
    }

    // Прямой переход на /dashboard без авторизации — немедленный редирект (нет анимации для прерывания)
    if (!isAuthenticated && !wasAuthRef.current) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
