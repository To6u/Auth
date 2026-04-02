/// <reference types="vite/client" />

declare const __BUILD_DATE__: string;

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    // Другие VITE_* переменные можно добавлять сюда
}
