export interface ApiError {
    message: string;
    code?: string;
}

export function isApiError(error: unknown): error is ApiError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as ApiError).message === 'string'
    );
}
