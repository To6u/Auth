import { useMemo } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { useAuthForm } from 'client/src/hooks/useAuthForm.ts';
import { MODE_CONFIGS } from 'client/src/constants/auth.constants.ts';
import {AnimatedTitle, FormFields, Logo, ModeSelector, SubmitButton} from "client/src/components/auth-form/components";

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

    // Уведомляем родителя об изменении состояния
    useMemo(() => {
        onExitingChange?.(isExiting);
    }, [isExiting, onExitingChange]);

    const modeConfig = useMemo(() => MODE_CONFIGS[viewMode], [viewMode]);

    return (
        <div className="login-container">
            <div className="auth-form-section-top">
                <Logo isExiting={isExiting} />
                <ModeSelector currentMode={viewMode} onModeChange={handleModeChange} />
            </div>

            <AnimatedTitle title={modeConfig.title} />

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