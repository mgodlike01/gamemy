import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    resolve: {
        dedupe: ['react', 'react-dom'],   // ← важно
    },
    server: {
        allowedHosts: ['localhost', 'lawlessly-sovereign-antelope.cloudpub.ru'], // если юзаешь cloudpub
    },
});
