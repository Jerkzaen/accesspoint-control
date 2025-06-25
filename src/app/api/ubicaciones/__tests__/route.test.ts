// RUTA: src/app/api/ubicaciones/__tests__/route.test.ts

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { UbicacionService } from '@/services/ubicacionService';

// --- MOCKS ---
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));
vi.mock('@/services/ubicacionService');

// --- IMPORTACIÓN DEL CÓDIGO A PROBAR ---
import { GET, POST } from '../route';
import { GET as getById, PUT as putById, DELETE as deleteById } from '../[id]/route';

describe('API Endpoints para /api/ubicaciones (Suite Completa)', () => {

  const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };
  const mockUbicacion = {
    id: 'ubicacion-test-id',
    nombreReferencial: 'Oficina Principal',
    sucursalId: 'sucursal-test-id',
    notas: 'Notas de la ubicación',
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // --- Pruebas para /api/ubicaciones ---
  describe('GET /api/ubicaciones', () => {
    it('debe devolver 401 si el usuario no está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(null);
      const request = new Request('http://localhost/api/ubicaciones');
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(401);
    });

    it('debe devolver una lista de ubicaciones si el usuario está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(mockAdminSession);
      (UbicacionService.getUbicaciones as Mock).mockResolvedValue([mockUbicacion]);
      const request = new Request('http://localhost/api/ubicaciones');
      const response = await GET(request as NextRequest);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toEqual([mockUbicacion]);
    });
  });

  describe('POST /api/ubicaciones', () => {
    it('debe crear una ubicación si los datos son válidos y está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        const newUbicacionData = { nombreReferencial: 'Bodega Central', sucursalId: 'suc-central-id' };
        (UbicacionService.createUbicacion as Mock).mockResolvedValue({ id: 'new-id', ...newUbicacionData });
        const request = new Request('http://localhost/api/ubicaciones', {
            method: 'POST', body: JSON.stringify(newUbicacionData),
        });
        const response = await POST(request as NextRequest);
        const body = await response.json();
        expect(response.status).toBe(201);
        expect(body.nombreReferencial).toBe('Bodega Central');
    });
  });

  // --- Pruebas para /api/ubicaciones/[id] ---
  describe('GET /api/ubicaciones/[id]', () => {
    it('debe devolver una ubicación por ID si está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (UbicacionService.getUbicacionById as Mock).mockResolvedValue(mockUbicacion);
        const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`);
        const response = await getById(request, { params: { id: mockUbicacion.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body).toEqual(mockUbicacion);
    });

    it('debe devolver 404 si la ubicación no se encuentra', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (UbicacionService.getUbicacionById as Mock).mockResolvedValue(null);
        const request = new Request(`http://localhost/api/ubicaciones/id-no-existe`);
        const response = await getById(request, { params: { id: 'id-no-existe' } });
        expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/ubicaciones/[id]', () => {
    it('debe actualizar una ubicación y devolver 200', async () => {
        const updateData = { nombreReferencial: 'Oficina Gerencia' };
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (UbicacionService.updateUbicacion as Mock).mockResolvedValue({ ...mockUbicacion, ...updateData });
        const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`, {
            method: 'PUT', body: JSON.stringify(updateData)
        });
        const response = await putById(request, { params: { id: mockUbicacion.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.nombreReferencial).toBe('Oficina Gerencia');
    });
  });

  describe('DELETE /api/ubicaciones/[id]', () => {
    it('debe eliminar una ubicación y devolver 200', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (UbicacionService.deleteUbicacion as Mock).mockResolvedValue(undefined);
        const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`, { method: 'DELETE' });
        const response = await deleteById(request, { params: { id: mockUbicacion.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.message).toBe('Ubicación eliminada exitosamente');
    });
  });
});
