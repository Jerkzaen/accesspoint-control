// RUTA: /vitest.setup.ts
// (Este archivo va en la raíz de tu proyecto)

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extiende `expect` con los matchers de jest-dom (ej: .toBeInTheDocument())
expect.extend(matchers);

// Ejecuta una limpieza (cleanup) después de cada prueba
// para evitar fugas de memoria y tests que se afecten entre sí.
afterEach(() => {
  cleanup();
});

// NOTA: Hemos eliminado el mock global de Prisma.
// A partir de ahora, mockearemos los servicios directamente en cada
// archivo de prueba. Esta es una práctica más limpia y robusta.
