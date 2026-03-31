import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts'],
        // Env vars устанавливаются до загрузки модулей — db.ts подхватит DB_PATH
        env: {
            DB_PATH: ':memory:',
            JWT_SECRET: 'test-secret-key',
            NODE_ENV: 'test',
        },
    },
});
