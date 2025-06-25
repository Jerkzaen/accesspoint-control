// RUTA: /__mocks__/next-auth.ts
// (Crea la carpeta __mocks__ en la raíz de tu proyecto, al mismo nivel que `src`)

import { vi } from 'vitest';

/**
 * Mock de la función getServerSession.
 * Al llamar a `vi.mock('next-auth')` en un test, Vitest usará esta
 * función en lugar de la real, permitiéndonos controlar qué devuelve
 * en cada prueba.
 */
export const getServerSession = vi.fn();