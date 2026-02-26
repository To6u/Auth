import { z } from 'zod';

/**
 * Zod-схемы для валидации API-ответов на клиенте.
 *
 * Зачем:
 *   - TypeScript проверяет типы только на этапе компиляции
 *   - В рантайме сервер может вернуть неожиданную структуру
 *   - schema.parse() бросает понятный ZodError вместо "cannot read property of undefined"
 */

// ─── Базовые сущности ─────────────────────────────────────────────────────────

export const UserSchema = z.object({
    id: z.number(),
    email: z.string().email(),
    createdAt: z.string().optional(),
    // Сервер может вернуть snake_case (created_at) — принимаем оба варианта
    created_at: z.string().optional(),
});

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export const LoginResponseSchema = z.object({
    user: UserSchema,
});

export const RegisterResponseSchema = z.object({
    message: z.string(),
    userId: z.number(),
});

export const CheckEmailResponseSchema = z.object({
    emailExists: z.boolean(),
});

// ─── Выведенные TypeScript-типы (единственный источник правды) ────────────────

export type User = z.infer<typeof UserSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type CheckEmailResponse = z.infer<typeof CheckEmailResponseSchema>;
