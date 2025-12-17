import { useState, useCallback } from 'react';
import type {
    ViewMode,
    FormData,
    FormErrors,
    TouchedFields,
} from '../types/auth.types';
import {
    getInitialFormData,
    INITIAL_ERRORS,
    INITIAL_TOUCHED,
    MODE_CONFIGS,
    SUCCESS_MESSAGES,
} from '../constants/auth.constants';
import {
    validateEmail,
    validatePassword,
    validateConfirmPassword,
    validateName,
    getFieldValidator,
} from '../utils/validation.utils';

export const useAuthForm = (initialMode: ViewMode = 'login') => {
    const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
    const [formData, setFormData] = useState<FormData>(getInitialFormData(initialMode));
    const [errors, setErrors] = useState<FormErrors>(INITIAL_ERRORS);
    const [touched, setTouched] = useState<TouchedFields>(INITIAL_TOUCHED);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    /**
     * Change view mode and reset form
     */
    const handleModeChange = useCallback((mode: ViewMode) => {
        setViewMode(mode);
        setFormData(getInitialFormData(mode));
        setErrors(INITIAL_ERRORS);
        setTouched(INITIAL_TOUCHED);
    }, []);

    /**
     * Handle input field changes with real-time validation
     */
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;

            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));

            // Validate only if field was already touched
            if (touched[name as keyof TouchedFields]) {
                const validator = getFieldValidator(name, formData.password);
                const error = validator(value);

                setErrors((prev) => ({
                    ...prev,
                    [name]: error,
                }));

                // Re-validate confirm password when password changes
                if (
                    name === 'password' &&
                    viewMode === 'register' &&
                    formData.confirmPassword
                ) {
                    setErrors((prev) => ({
                        ...prev,
                        confirmPassword: validateConfirmPassword(
                            formData.confirmPassword!,
                            value
                        ),
                    }));
                }
            }
        },
        [touched, formData.password, formData.confirmPassword, viewMode]
    );

    /**
     * Handle input blur with validation
     */
    const handleBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            const { name, value } = e.target;

            setTouched((prev) => ({
                ...prev,
                [name]: true,
            }));

            const validator = getFieldValidator(name, formData.password);
            const error = validator(value);

            setErrors((prev) => ({
                ...prev,
                [name]: error,
            }));
        },
        [formData.password]
    );

    /**
     * Validate all fields for current mode
     */
    const validateForm = useCallback((): boolean => {
        const config = MODE_CONFIGS[viewMode];
        const newErrors: FormErrors = {
            email: '',
            password: '',
            confirmPassword: '',
            name: '',
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
            newErrors.name = validateName(formData.name!);
        }

        setErrors(newErrors);

        // Mark fields as touched
        const newTouched = config.fieldsToValidate.reduce(
            (acc, field) => ({
                ...acc,
                [field]: true,
            }),
            {} as TouchedFields
        );
        setTouched((prev) => ({ ...prev, ...newTouched }));

        // Check if any errors exist
        return !config.fieldsToValidate.some((field) => newErrors[field]);
    }, [viewMode, formData]);

    /**
     * Submit form
     */
    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const isValid = validateForm();
            if (!isValid) {
                return;
            }

            setIsLoading(true);

            try {
                console.log(`${viewMode} - отправка данных:`, formData);

                // Simulate API request
                await new Promise((resolve) => setTimeout(resolve, 1500));

                // Success
                alert(SUCCESS_MESSAGES[viewMode]);

                // Reset form
                setFormData(getInitialFormData(viewMode));
                setErrors(INITIAL_ERRORS);
                setTouched(INITIAL_TOUCHED);
            } catch (err) {
                setErrors((prev) => ({
                    ...prev,
                    email: 'Ошибка операции. Проверьте данные',
                }));
            } finally {
                setIsLoading(false);
            }
        },
        [viewMode, formData, validateForm]
    );

    return {
        viewMode,
        formData,
        errors,
        touched,
        isLoading,
        handleModeChange,
        handleChange,
        handleBlur,
        handleSubmit,
    };
};
