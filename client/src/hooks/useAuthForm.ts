import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
    ViewMode,
    FormData,
    FormErrors,
    TouchedFields,
} from 'client/src/types/auth.types';
import {
    getInitialFormData,
    INITIAL_ERRORS,
    INITIAL_TOUCHED,
    MODE_CONFIGS,
    SUCCESS_MESSAGES,
} from 'client/src/constants/auth.constants';
import {
    validateEmail,
    validatePassword,
    validateConfirmPassword,
    getFieldValidator,
} from 'client/src/utils/validation.utils';
import { registerUser, loginUser, checkEmail, resetPassword } from 'client/src/services/api.service';
import {useAuthInfo} from "@/hooks/useAuthInfo.ts";

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Произошла неизвестная ошибка';
}

export const useAuthForm = (initialMode: ViewMode = 'login') => {
    const navigate = useNavigate();
    const { login } = useAuthInfo();

    const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
    const [formData, setFormData] = useState<FormData>(getInitialFormData(initialMode));
    const [errors, setErrors] = useState<FormErrors>(INITIAL_ERRORS);
    const [touched, setTouched] = useState<TouchedFields>(INITIAL_TOUCHED);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPasswordFields, setShowPasswordFields] = useState<boolean>(false);
    const [isExiting, setIsExiting] = useState<boolean>(false); // <- новое состояние для анимации выхода

    const handleModeChange = useCallback((mode: ViewMode) => {
        setViewMode(mode);
        setFormData(getInitialFormData(mode));
        setErrors(INITIAL_ERRORS);
        setTouched(INITIAL_TOUCHED);
        setShowPasswordFields(false);
    }, []);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;

            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));

            if (touched[name as keyof TouchedFields]) {
                const validator = getFieldValidator(name, formData.password);
                const error = validator(value);

                setErrors((prev) => ({
                    ...prev,
                    [name]: error,
                }));

                // Re-validate confirmPassword when password changes
                if (name === 'password' && viewMode === 'register' && formData.confirmPassword) {
                    setErrors((prev) => ({
                        ...prev,
                        confirmPassword: validateConfirmPassword(
                            formData.confirmPassword!,
                            value
                        ),
                    }));
                }

                // Re-validate confirmNewPassword when newPassword changes
                if (name === 'newPassword' && formData.confirmNewPassword) {
                    setErrors((prev) => ({
                        ...prev,
                        confirmNewPassword: validateConfirmPassword(
                            formData.confirmNewPassword!,
                            value
                        ),
                    }));
                }
            }
        },
        [touched, formData.password, formData.confirmPassword, formData.confirmNewPassword, viewMode]
    );

    const handleBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            const { name, value } = e.target;

            setTouched((prev) => ({
                ...prev,
                [name]: true,
            }));

            const validator = getFieldValidator(name, formData.password || formData.newPassword);
            const error = validator(value);

            setErrors((prev) => ({
                ...prev,
                [name]: error,
            }));
        },
        [formData.password, formData.newPassword]
    );

    const validateForm = useCallback((): boolean => {
        const config = MODE_CONFIGS[viewMode];
        const newErrors: FormErrors = {
            email: '',
            password: '',
            confirmPassword: '',
            newPassword: '',
            confirmNewPassword: '',
        };

        // Validate email (required for all modes)
        newErrors.email = validateEmail(formData.email);

        // Validate password (not required for reset)
        if (viewMode !== 'reset') {
            newErrors.password = validatePassword(formData.password);
        }

        // Validate additional fields for register
        if (viewMode === 'register') {
            newErrors.confirmPassword = validateConfirmPassword(
                formData.confirmPassword!,
                formData.password
            );
        }

        // Validate new password fields for reset (when visible)
        if (viewMode === 'reset' && showPasswordFields) {
            newErrors.newPassword = validatePassword(formData.newPassword || '');
            newErrors.confirmNewPassword = validateConfirmPassword(
                formData.confirmNewPassword || '',
                formData.newPassword || ''
            );
        }

        setErrors(newErrors);

        const newTouched = config.fieldsToValidate.reduce(
            (acc, field) => ({
                ...acc,
                [field]: true,
            }),
            {} as TouchedFields
        );

        if (viewMode === 'reset' && showPasswordFields) {
            newTouched.newPassword = true;
            newTouched.confirmNewPassword = true;
        }

        setTouched((prev) => ({ ...prev, ...newTouched }));

        // Check if any errors exist
        if (viewMode === 'reset' && showPasswordFields) {
            return !newErrors.email && !newErrors.newPassword && !newErrors.confirmNewPassword;
        }

        return !config.fieldsToValidate.some((field) => newErrors[field]);
    }, [viewMode, formData, showPasswordFields]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const isValid = validateForm();
            if (!isValid) {
                return;
            }

            setIsLoading(true);

            try {
                if (viewMode === 'register') {
                    await registerUser({
                        email: formData.email,
                        password: formData.password,
                    });
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

                    // Запускаем анимацию выхода
                    setIsExiting(true);

                    // Ждём завершения анимации перед переходом (600ms)
                    setTimeout(() => {
                        navigate('/profile');
                    }, 600);
                } else if (viewMode === 'reset') {
                    if (!showPasswordFields) {
                        // Шаг 1: Проверяем email
                        await checkEmail(formData.email);
                        setShowPasswordFields(true);
                        setIsLoading(false);
                        return;
                    } else {
                        // Шаг 2: Сбрасываем пароль
                        await resetPassword(formData.email, formData.newPassword!);
                        alert('Пароль успешно изменён! Войдите с новым паролем.');
                        setViewMode('login');
                        setFormData(getInitialFormData('login'));
                        setErrors(INITIAL_ERRORS);
                        setTouched(INITIAL_TOUCHED);
                        setShowPasswordFields(false);
                    }
                }
            } catch (err) {
                setErrors((prev) => ({
                    ...prev,
                    email: getErrorMessage(err),
                }));
                setIsLoading(false); // Важно: сбрасываем loading при ошибке
            } finally {
                // Убираем finally для login, чтобы isLoading оставался true во время анимации
                if (viewMode !== 'login') {
                    setIsLoading(false);
                }
            }
        },
        [viewMode, formData, validateForm, navigate, login, showPasswordFields]
    );

    return {
        viewMode,
        formData,
        errors,
        touched,
        isLoading,
        showPasswordFields,
        isExiting,
        handleModeChange,
        handleChange,
        handleBlur,
        handleSubmit,
    };
};