import type { FormData, FormErrors, TouchedFields, ViewMode } from 'client/src/types/auth.types.ts';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useState } from 'react';
import { InputField } from '@/components/auth-form/components/InputField/InputField';
import { getPasswordStrength } from '@/utils/validation.utils';

interface FormFieldsProps {
    viewMode: ViewMode;
    formData: FormData;
    errors: FormErrors;
    touched: TouchedFields;
    isLoading: boolean;
    showPasswordFields?: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    /** Notifies parent which field is currently focused (null = none) */
    onFocusField?: (name: string | null) => void;
}

export const FormFields = memo<FormFieldsProps>(
    ({
        viewMode,
        formData,
        errors,
        touched,
        isLoading,
        showPasswordFields = false,
        onChange,
        onBlur,
        onFocusField,
    }) => {
        // ── Password visibility toggles ─────────────────────────────
        const [visibility, setVisibility] = useState({
            password: false,
            confirmPassword: false,
            newPassword: false,
            confirmNewPassword: false,
        });

        const toggleVisibility = useCallback((field: keyof typeof visibility) => {
            setVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
        }, []);

        // ── Wrapped blur: also clears focused-field for FormProgress ─
        const handleBlur = useCallback(
            (e: React.FocusEvent<HTMLInputElement>) => {
                onFocusField?.(null);
                onBlur(e);
            },
            [onBlur, onFocusField]
        );

        // ── Confirm-password match icon ─────────────────────────────
        const confirmMatchStatus = (() => {
            const val = formData.confirmPassword ?? '';
            if (!val) return 'none' as const;
            return val === formData.password ? ('match' as const) : ('mismatch' as const);
        })();

        return (
            <AnimatePresence initial={false}>
                {/* Email field - always visible */}
                <motion.div key="email-wrapper" layout="position">
                    <InputField
                        key="email-field"
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        placeholder="example@mail.com"
                        label="Email"
                        error={errors.email}
                        touched={touched.email}
                        disabled={isLoading || (viewMode === 'reset' && showPasswordFields)}
                        onChange={onChange}
                        onFocus={() => onFocusField?.('email')}
                        onBlur={handleBlur}
                        autoComplete="email"
                    />
                </motion.div>

                {/* Password field - hidden in reset mode */}
                {viewMode !== 'reset' && (
                    <motion.div
                        key="password-wrapper"
                        layout="position"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <InputField
                            key="password-field"
                            type={visibility.password ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            placeholder="Минимум 6 символов"
                            label="Пароль"
                            error={errors.password}
                            touched={touched.password}
                            disabled={isLoading}
                            onChange={onChange}
                            onFocus={() => onFocusField?.('password')}
                            onBlur={handleBlur}
                            autoComplete={
                                viewMode === 'register' ? 'new-password' : 'current-password'
                            }
                            showPasswordToggle
                            isPasswordVisible={visibility.password}
                            onTogglePassword={() => toggleVisibility('password')}
                            strengthLevel={
                                viewMode === 'register'
                                    ? getPasswordStrength(formData.password)
                                    : undefined
                            }
                        />
                    </motion.div>
                )}

                {/* Confirm password field - only for registration */}
                {viewMode === 'register' && (
                    <motion.div
                        key="confirm-password-wrapper"
                        layout="position"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <InputField
                            key="confirm-password-field"
                            type={visibility.confirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword || ''}
                            placeholder="Повторите пароль"
                            label="Подтверждение пароля"
                            error={errors.confirmPassword || ''}
                            touched={touched.confirmPassword || false}
                            disabled={isLoading}
                            onChange={onChange}
                            onFocus={() => onFocusField?.('confirmPassword')}
                            onBlur={handleBlur}
                            autoComplete="new-password"
                            showPasswordToggle
                            isPasswordVisible={visibility.confirmPassword}
                            onTogglePassword={() => toggleVisibility('confirmPassword')}
                            matchStatus={confirmMatchStatus}
                        />
                    </motion.div>
                )}

                {/* New Password Fields - для reset mode, показываем после проверки email */}
                {viewMode === 'reset' && showPasswordFields && (
                    <>
                        <motion.div
                            key="new-password-wrapper"
                            layout="position"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <InputField
                                key="new-password-field"
                                type={visibility.newPassword ? 'text' : 'password'}
                                id="newPassword"
                                name="newPassword"
                                value={formData.newPassword || ''}
                                placeholder="Минимум 6 символов"
                                label="Новый пароль"
                                error={errors.newPassword || ''}
                                touched={touched.newPassword || false}
                                disabled={isLoading}
                                onChange={onChange}
                                onFocus={() => onFocusField?.('newPassword')}
                                onBlur={handleBlur}
                                autoComplete="new-password"
                                showPasswordToggle
                                isPasswordVisible={visibility.newPassword}
                                onTogglePassword={() => toggleVisibility('newPassword')}
                                strengthLevel={getPasswordStrength(formData.newPassword ?? '')}
                            />
                        </motion.div>

                        <motion.div
                            key="confirm-new-password-wrapper"
                            layout="position"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <InputField
                                key="confirm-new-password-field"
                                type={visibility.confirmNewPassword ? 'text' : 'password'}
                                id="confirmNewPassword"
                                name="confirmNewPassword"
                                value={formData.confirmNewPassword || ''}
                                placeholder="Повторите новый пароль"
                                label="Подтверждение нового пароля"
                                error={errors.confirmNewPassword || ''}
                                touched={touched.confirmNewPassword || false}
                                disabled={isLoading}
                                onChange={onChange}
                                onFocus={() => onFocusField?.('confirmNewPassword')}
                                onBlur={handleBlur}
                                autoComplete="new-password"
                                showPasswordToggle
                                isPasswordVisible={visibility.confirmNewPassword}
                                onTogglePassword={() => toggleVisibility('confirmNewPassword')}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        );
    }
);

FormFields.displayName = 'FormFields';
