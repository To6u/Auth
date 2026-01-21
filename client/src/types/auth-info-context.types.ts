export interface User {
    id: number;
    email: string;
    created_at?: string;
}

export interface AuthInfoContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => void;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
}