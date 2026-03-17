import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedPageWrapper } from '@/components/layout/AnimatedPageWrapper';
import { useAuthInfo } from '@/hooks/useAuthInfo';
import './dashboard.css';

export const DashboardPage = () => {
    const { user, logout } = useAuthInfo();
    const navigate = useNavigate();

    const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (logoutTimerRef.current !== null) {
                clearTimeout(logoutTimerRef.current);
            }
        };
    }, []);

    const handleLogout = useCallback(
        (triggerExit: () => void) => {
            triggerExit();
            logoutTimerRef.current = setTimeout(async () => {
                await logout();
                navigate('/');
            }, 600);
        },
        [logout, navigate]
    );

    const handleGoToProfile = useCallback(
        (triggerExit: () => void) => {
            triggerExit();
            logoutTimerRef.current = setTimeout(() => {
                navigate('/');
            }, 600);
        },
        [navigate]
    );

    const formattedDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          })
        : null;

    return (
        <AnimatedPageWrapper enterFrom="right" exitTo="left">
            {({ isExiting, triggerExit }) => (
                <div className="dashboard">
                    <div className="dashboard__card">
                        <div className="dashboard__header">
                            <h1 className="dashboard__title">Панель управления</h1>
                        </div>

                        <div className="dashboard__user">
                            <p className="dashboard__email">{user?.email}</p>
                            {formattedDate && (
                                <p className="dashboard__created">
                                    Аккаунт создан: {formattedDate}
                                </p>
                            )}
                        </div>

                        <div className="dashboard__actions">
                            <button
                                className="dashboard__btn dashboard__btn--primary"
                                onClick={() => handleGoToProfile(triggerExit)}
                                disabled={isExiting}
                                type="button"
                            >
                                Перейти к профилю
                            </button>

                            <button
                                className="dashboard__btn dashboard__btn--danger"
                                onClick={() => handleLogout(triggerExit)}
                                disabled={isExiting}
                                type="button"
                            >
                                Выйти
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AnimatedPageWrapper>
    );
};

export default DashboardPage;
