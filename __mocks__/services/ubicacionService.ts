import { vi } from 'vitest';

export const UbicacionService = {
  getUbicaciones: vi.fn(),
  getUbicacionById: vi.fn(),
  createUbicacion: vi.fn(),
  updateUbicacion: vi.fn(),
  deleteUbicacion: vi.fn(),
};