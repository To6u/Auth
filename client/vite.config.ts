/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const MONTHS = [
    'январь',
    'февраль',
    'март',
    'апрель',
    'май',
    'июнь',
    'июль',
    'август',
    'сентябрь',
    'октябрь',
    'ноябрь',
    'декабрь',
];
const d = new Date();
const buildDate = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

export default defineConfig({
    plugins: [react()],
    define: {
        __BUILD_DATE__: JSON.stringify(buildDate),
    },
    resolve: {
        alias: {
            '@': new URL('./src', import.meta.url).pathname,
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'framer-motion'],
    },
    build: {
        assetsInlineLimit: 0, // Отключаем инлайн для шрифтов
        target: 'es2015',
        cssMinify: false,
    },
    esbuild: {
        target: 'es2015',
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/test/**', 'src/**/*.d.ts'],
        },
    },
});
