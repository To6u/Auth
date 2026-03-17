import { createContext } from 'react';
import type { AuthInfoContextType } from '@/types/auth-info-context.types.ts';

export const AuthInfoContext = createContext<AuthInfoContextType | undefined>(undefined);
