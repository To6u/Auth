import { useMemo, useEffect, useState, useCallback } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { useAuthForm } from 'client/src/hooks/useAuthForm.ts';
import { MODE_CONFIGS } from 'client/src/constants/auth.constants.ts';
import {AnimatedTitle, FormFields, Logo, ModeSelector, SubmitButton} from "client/src/components/auth-form/components";
import { FormProgress } from './components/FormProgress/FormProgress';
import type { SegmentStatus } from './components/FormProgress/FormProgress';
import type { FormData, FormErrors, TouchedFields } from 'client/src/types/auth.types';

interface AuthFormProps {
    onExitingChange?: (isExiting: boolean) => void;
}

export const AuthForm = ({ onExitingChange }: AuthFormProps) => {
    const {
        viewMode,
        formData,
        errors,
        touched,
        isLoading,
        isExiting,
        handleModeChange,
        handleChange,
        handleBlur,
        handleSubmit,
        showPasswordFields,
    } = useAuthForm('login');

    // Уведомляем родителя об изменении состояния — side effect, не вычисление
    useEffect(() => {
        onExitingChange?.(isExiting);
    }, [isExiting, onExitingChange]);

    const modeConfig = useMemo(() => MODE_CONFIGS[viewMode], [viewMode]);

    // ── FormProgress — focused field tracking ──────────────────────
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleFocusField = useCallback((name: string | null) => {
        setFocusedField(name);
    }, []);

    const fieldOrder: string[] = useMemo(() => {
        if (viewMode === 'login') return ['email', 'password'];
        if (viewMode === 'register') return ['email', 'password', 'confirmPassword'];
        return showPasswordFields ? ['email', 'newPassword', 'confirmNewPassword'] : ['email'];
    }, [viewMode, showPasswordFields]);

    // Примитивная строка-ключ из значений полей — изменяется только когда меняются сами данные,
    // а не ссылки на объекты formData/errors/touched
    const segmentDeps = fieldOrder
        .map((f) => {
            const fd = formData as Record<string, string | undefined>;
            const fe = errors as Record<string, string | undefined>;
            const ft = touched as Record<string, boolean | undefined>;
            return `${fd[f] ?? ''}|${fe[f] ?? ''}|${ft[f] ?? ''}`;
        })
        .join(',');

    const segments: SegmentStatus[] = useMemo(() => {
        const fd = formData as Record<string, string | undefined>;
        const fe = errors as Record<string, string | undefined>;
        const ft = touched as Record<string, boolean | undefined>;

        return fieldOrder.map((field): SegmentStatus => {
            if (field === focusedField) return 'filling';
            const isTouched = !!ft[field];
            const hasError = !!(fe[field]);
            const value = fd[field];
            if (isTouched && hasError) return 'error';
            // value без touched — корректно: покрывает автозаполнение браузера
            if (value && !hasError) return 'valid';
            return 'empty';
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fieldOrder, focusedField, segmentDeps]);

    return (
        <div className="login-container">
            <div className="auth-form-section-top">
                <Logo isExiting={isExiting} />
                <ModeSelector currentMode={viewMode} onModeChange={handleModeChange} />
            </div>

            <AnimatedTitle title={modeConfig.title} />

            <FormProgress segments={segments} />

            <LayoutGroup>
                <motion.form
                    onSubmit={handleSubmit}
                    className="login-form"
                    noValidate
                    layout
                >
                    <FormFields
                        viewMode={viewMode}
                        formData={formData}
                        errors={errors}
                        touched={touched}
                        isLoading={isLoading}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        showPasswordFields={showPasswordFields}
                        onFocusField={handleFocusField}
                    />

                    <SubmitButton
                        isLoading={isLoading}
                        buttonText={modeConfig.buttonText}
                    />
                </motion.form>
            </LayoutGroup>
        </div>
    );
};

export default AuthForm;