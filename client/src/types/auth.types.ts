export type ViewMode = 'login' | 'register' | 'reset';

export interface FormData {
    email: string;
    password: string;
    confirmPassword?: string;
    newPassword?: string;
    confirmNewPassword?: string;
}

export interface FormErrors {
    email: string;
    password: string;
    confirmPassword?: string;
    newPassword?: string;
    confirmNewPassword?: string;
}

export interface TouchedFields {
    email: boolean;
    password: boolean;
    confirmPassword?: boolean;
    newPassword?: boolean;
    confirmNewPassword?: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    errors: FormErrors;
}

export interface ModeConfig {
    title: string;
    buttonText: string;
    fieldsToValidate: (keyof FormData)[];
}
