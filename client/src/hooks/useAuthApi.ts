import {
    getInitialFormData,
    INITIAL_ERRORS,
    INITIAL_TOUCHED,
    SUCCESS_MESSAGES,
} from 'client/src/constants/auth.constants';
import {
    checkEmail,
    loginUser,
    registerUser,
    resetPassword,
} from 'client/src/services/api.service';
import type { FormData, FormErrors, TouchedFields, ViewMode } from 'client/src/types/auth.types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthInfo } from '@/hooks/useAuthInfo';

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Произошла неизвестная ошибка';
}

interface UseAuthApiParams {
    viewMode: ViewMode;
    formData: FormData;
    showPasswordFields: boolean;
    validateForm: () => boolean;
    setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    setTouched: React.Dispatch<React.SetStateAction<TouchedFields>>;
    setShowPasswordFields: React.Dispatch<React.SetStateAction<boolean>>;
    onViewModeChange: (mode: ViewMode) => void;
}

/**
 * Управляет API-вызовами, loading-состоянием и навигацией.
 * Не знает о деталях валидации — получает validateForm снаружи.
 */
export const useAuthApi = ({
    viewMode,
    formData,
    showPasswordFields,
    validateForm,
    setErrors,
    setFormData,
    setTouched,
    setShowPasswordFields,
    onViewModeChange,
}: UseAuthApiParams) => {
    const navigate = useNavigate();
    const { login } = useAuthInfo();

    const [isLoading, setIsLoading] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    // Ref для таймера навигации — отменяется при размонтировании
    const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (navigationTimerRef.current !== null) {
                clearTimeout(navigationTimerRef.current);
            }
        };
    }, []);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            if (!validateForm()) return;

            setIsLoading(true);

            try {
                if (viewMode === 'register') {
                    await registerUser({ email: formData.email, password: formData.password });
                    alert(SUCCESS_MESSAGES[viewMode]);
                    setFormData(getInitialFormData(viewMode));
                    setErrors(INITIAL_ERRORS);
                    setTouched(INITIAL_TOUCHED);
                } else if (viewMode === 'login') {
                    const data = await loginUser({
                        email: formData.email,
                        password: formData.password,
                    });
                    login(data.user);
                    setIsExiting(true);
                    navigationTimerRef.current = setTimeout(() => {
                        navigate('/dashboard');
                    }, 600);
                } else if (viewMode === 'reset') {
                    if (!showPasswordFields) {
                        // Шаг 1: проверяем email
                        await checkEmail(formData.email);
                        setShowPasswordFields(true);
                        setIsLoading(false);
                        return;
                    } else {
                        // Шаг 2: сбрасываем пароль
                        await resetPassword(formData.email, formData.newPassword!);
                        alert('Пароль успешно изменён! Войдите с новым паролем.');
                        onViewModeChange('login');
                        setFormData(getInitialFormData('login'));
                        setErrors(INITIAL_ERRORS);
                        setTouched(INITIAL_TOUCHED);
                        setShowPasswordFields(false);
                    }
                }
            } catch (err) {
                setErrors((prev) => ({ ...prev, email: getErrorMessage(err) }));
                setIsLoading(false);
            } finally {
                // isLoading остаётся true для login — пока не завершится анимация
                if (viewMode !== 'login') {
                    setIsLoading(false);
                }
            }
        },
        [
            viewMode,
            formData,
            showPasswordFields,
            validateForm,
            navigate,
            login,
            setErrors,
            setFormData,
            setTouched,
            setShowPasswordFields,
            onViewModeChange,
        ]
    );

    return { isLoading, isExiting, handleSubmit };
};
