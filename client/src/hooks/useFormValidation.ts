import { useState, useCallback, useRef, useEffect } from 'react';
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
} from 'client/src/constants/auth.constants';
import {
    validateEmail,
    validatePassword,
    validateConfirmPassword,
    getFieldValidator,
} from 'client/src/utils/validation.utils';

/**
 * Управляет состоянием полей формы и логикой валидации.
 * Не знает об API, навигации или режиме аутентификации.
 *
 * @param viewMode         - текущий режим формы (login / register / reset)
 * @param showPasswordFields - показывать ли поля нового пароля (для reset)
 */
export const useFormValidation = (viewMode: ViewMode, showPasswordFields: boolean) => {
    const [formData, setFormData] = useState<FormData>(getInitialFormData(viewMode));
    const [errors, setErrors] = useState<FormErrors>(INITIAL_ERRORS);
    const [touched, setTouched] = useState<TouchedFields>(INITIAL_TOUCHED);

    // Ref для чтения touched в handleChange без включения объекта в deps
    const touchedRef = useRef(touched);
    useEffect(() => { touchedRef.current = touched; });

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;

            setFormData((prev) => ({ ...prev, [name]: value }));

            if (touchedRef.current[name as keyof TouchedFields]) {
                const validator = getFieldValidator(name, formData.password);
                const error = validator(value);
                setErrors((prev) => ({ ...prev, [name]: error }));

                // Re-validate confirmPassword когда меняется password
                if (name === 'password' && viewMode === 'register' && formData.confirmPassword) {
                    setErrors((prev) => ({
                        ...prev,
                        confirmPassword: validateConfirmPassword(formData.confirmPassword!, value),
                    }));
                }

                // Re-validate confirmNewPassword когда меняется newPassword
                if (name === 'newPassword' && formData.confirmNewPassword) {
                    setErrors((prev) => ({
                        ...prev,
                        confirmNewPassword: validateConfirmPassword(formData.confirmNewPassword!, value),
                    }));
                }
            }
        },
        [formData.password, formData.confirmPassword, formData.confirmNewPassword, viewMode]
    );

    const handleBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            const { name, value } = e.target;

            setTouched((prev) => ({ ...prev, [name]: true }));

            const validator = getFieldValidator(name, formData.password || formData.newPassword);
            const error = validator(value);
            setErrors((prev) => ({ ...prev, [name]: error }));
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

        newErrors.email = validateEmail(formData.email);

        if (viewMode !== 'reset') {
            newErrors.password = validatePassword(formData.password);
        }

        if (viewMode === 'register') {
            newErrors.confirmPassword = validateConfirmPassword(
                formData.confirmPassword!,
                formData.password
            );
        }

        if (viewMode === 'reset' && showPasswordFields) {
            newErrors.newPassword = validatePassword(formData.newPassword || '');
            newErrors.confirmNewPassword = validateConfirmPassword(
                formData.confirmNewPassword || '',
                formData.newPassword || ''
            );
        }

        setErrors(newErrors);

        const newTouched = config.fieldsToValidate.reduce(
            (acc, field) => ({ ...acc, [field]: true }),
            {} as TouchedFields
        );

        if (viewMode === 'reset' && showPasswordFields) {
            newTouched.newPassword = true;
            newTouched.confirmNewPassword = true;
        }

        setTouched((prev) => ({ ...prev, ...newTouched }));

        if (viewMode === 'reset' && showPasswordFields) {
            return !newErrors.email && !newErrors.newPassword && !newErrors.confirmNewPassword;
        }

        return !config.fieldsToValidate.some((field) => newErrors[field]);
    }, [viewMode, formData, showPasswordFields]);

    /** Сброс формы при смене режима */
    const resetForm = useCallback((mode: ViewMode) => {
        setFormData(getInitialFormData(mode));
        setErrors(INITIAL_ERRORS);
        setTouched(INITIAL_TOUCHED);
    }, []);

    return {
        formData,
        errors,
        touched,
        setErrors,
        setFormData,
        setTouched,
        handleChange,
        handleBlur,
        validateForm,
        resetForm,
    };
};
