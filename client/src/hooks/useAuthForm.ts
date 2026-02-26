import { useState, useCallback } from 'react';
import type { ViewMode } from 'client/src/types/auth.types';
import { useFormValidation } from './useFormValidation';
import { useAuthApi } from './useAuthApi';

/**
 * Оркестратор: склеивает useFormValidation + useAuthApi.
 * Управляет viewMode и showPasswordFields — состояниями, нужными обоим хукам.
 * Публичный API не изменился — AuthForm.tsx не требует правок.
 */
export const useAuthForm = (initialMode: ViewMode = 'login') => {
    const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
    const [showPasswordFields, setShowPasswordFields] = useState(false);

    const {
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
    } = useFormValidation(viewMode, showPasswordFields);

    const { isLoading, isExiting, handleSubmit } = useAuthApi({
        viewMode,
        formData,
        showPasswordFields,
        validateForm,
        setErrors,
        setFormData,
        setTouched,
        setShowPasswordFields,
        onViewModeChange: setViewMode,
    });

    /** Смена режима — сбрасывает форму и все вспомогательные состояния */
    const handleModeChange = useCallback(
        (mode: ViewMode) => {
            setViewMode(mode);
            resetForm(mode);
            setShowPasswordFields(false);
        },
        [resetForm]
    );

    return {
        viewMode,
        formData,
        errors,
        touched,
        isLoading,
        isExiting,
        showPasswordFields,
        handleModeChange,
        handleChange,
        handleBlur,
        handleSubmit,
    };
};
