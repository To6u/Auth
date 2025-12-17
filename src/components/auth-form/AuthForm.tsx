import { useMemo } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { useAuthForm } from '@/hooks/useAuthForm.ts';
import { MODE_CONFIGS } from '@/constants/auth.constants.ts';
import {AnimatedTitle, FormFields, Logo, ModeSelector, SubmitButton} from "./components";

/**
 * AuthForm - Main authentication component
 * Handles login, registration, and password reset flows
 */
export const AuthForm = () => {
    const {
        viewMode,
        formData,
        errors,
        touched,
        isLoading,
        handleModeChange,
        handleChange,
        handleBlur,
        handleSubmit,
    } = useAuthForm('login');

    // Memoize current mode configuration
    const modeConfig = useMemo(() => MODE_CONFIGS[viewMode], [viewMode]);

    return (
        <div className="login-container">
            <div className="auth-form-section-top">
                <Logo />
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
