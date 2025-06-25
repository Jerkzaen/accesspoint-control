// RUTA: /vitest.config.ts
// (Este archivo va en la raíz de tu proyecto)

/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Activa las APIs globales (describe, it, expect, etc.) para no tener que importarlas en cada archivo.
    globals: true,
    // Simula un entorno de navegador (DOM) para poder probar componentes de React.
    environment: 'jsdom',
    // Opcional: Configura los mocks manuales en la carpeta __mocks__
    setupFiles: './vitest.setup.ts', // Puedes crear este archivo si necesitas configuraciones globales
  },
  resolve: {
    // Alias para que Vitest entienda las importaciones como '@/' igual que Next.js
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
