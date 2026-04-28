/// <reference types="vite/client" />

declare const __BUILD_DATE__: string;

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_DEMO_MODE: string | undefined;
    readonly VITE_DEMO_EMAIL: string | undefined;
    readonly VITE_DEMO_PASSWORD: string | undefined;
    // Другие VITE_* переменные можно добавлять сюда
}
