export type ViewMode = 'login' | 'register' | 'reset';

export interface FormData {
    email: string;
    password: string;
    confirmPassword?: string;
    name?: string;
}

export interface FormErrors {
    email: string;
    password: string;
    confirmPassword?: string;
    name?: string;
}

export interface TouchedFields {
    email: boolean;
    password: boolean;
    confirmPassword?: boolean;
    name?: boolean;
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
