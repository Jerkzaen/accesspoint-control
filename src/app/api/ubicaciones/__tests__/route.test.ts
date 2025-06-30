// RUTA: src/app/api/ubicaciones/__tests__/route.test.ts

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from "next-auth/next";
import { Prisma, Ubicacion } from "@prisma/client";
import { ZodError } from "zod";

// --- MOCKS EXTERNOS ---
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

// MOCKEAR EL MÓDULO @/services/geografiaService SIN VARIABLES EXTERNAS
vi.mock('@/services/geografiaService', () => ({
  GeografiaService: {
    getUbicacionesBySucursal: vi.fn(),
    getUbicacionById: vi.fn(),
    createUbicacion: vi.fn(),
    updateUbicacion: vi.fn(),
    deactivateUbicacion: vi.fn(),
  },
}));

// --- IMPORTACIÓN DEL CÓDIGO A PROBAR ---
import { GET, POST } from '../route';
import { GET as getById, PUT as putById, DELETE as deleteById } from '../[id]/route';

// Obtener las referencias a los mocks después de la importación
import { GeografiaService } from '@/services/geografiaService';

describe('API Endpoints para /api/ubicaciones (Suite Completa)', () => {

  const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };
  const mockUbicacion: Ubicacion = {
    id: 'ubicacion-test-id',
    nombreReferencial: 'Oficina Principal',
    sucursalId: 'sucursal-test-id',
    notas: 'Notas de la ubicación',
    estado: 'ACTIVA',
    createdAt: new Date('2025-06-29T03:45:20.732Z'),
    updatedAt: new Date('2025-06-29T03:45:20.732Z'),
  };

  beforeEach(() => {
    // Resetear todos los mocks globales de Vitest
    vi.clearAllMocks();
    (getServerSession as Mock).mockReset();

    // Resetear los mocks del servicio
    vi.mocked(GeografiaService.getUbicacionesBySucursal).mockReset();
    vi.mocked(GeografiaService.getUbicacionById).mockReset();
    vi.mocked(GeografiaService.createUbicacion).mockReset();
    vi.mocked(GeografiaService.updateUbicacion).mockReset();
    vi.mocked(GeografiaService.deactivateUbicacion).mockReset();
  });

  // --- Pruebas para /api/ubicaciones ---
  describe('GET /api/ubicaciones', () => {
    it('debe devolver 401 si el usuario no está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(null);
      const request = new Request('http://localhost/api/ubicaciones');
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(401);
    });

    it('debe devolver una lista de ubicaciones si el usuario está autenticado y se proporciona sucursalId', async () => {
      (getServerSession as Mock).mockResolvedValue(mockAdminSession);
      const expectedMockUbicacion = {
        ...mockUbicacion,
        createdAt: mockUbicacion.createdAt.toISOString(),
        updatedAt: mockUbicacion.updatedAt.toISOString(),
      };
      vi.mocked(GeografiaService.getUbicacionesBySucursal).mockResolvedValue([mockUbicacion]);
      const request = new Request('http://localhost/api/ubicaciones?sucursalId=sucursal-test-id');
      const response = await GET(request as NextRequest);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toEqual([expectedMockUbicacion]);
      expect(GeografiaService.getUbicacionesBySucursal).toHaveBeenCalledWith('sucursal-test-id');
    });

    it('debe devolver un array vacío si no se proporciona sucursalId', async () => {
      (getServerSession as Mock).mockResolvedValue(mockAdminSession);
      const request = new Request('http://localhost/api/ubicaciones'); // Sin sucursalId
      const response = await GET(request as NextRequest);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toEqual([]);
      expect(GeografiaService.getUbicacionesBySucursal).not.toHaveBeenCalled();
    });

    it('debe devolver 500 si el servicio de ubicaciones falla al obtener ubicaciones', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(GeografiaService.getUbicacionesBySucursal).mockRejectedValue(new Error('Error de DB al obtener ubicaciones'));
        const request = new Request('http://localhost/api/ubicaciones?sucursalId=test-id');
        const response = await GET(request as NextRequest);
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.message).toBe('Error de DB al obtener ubicaciones');
    });
  });

  describe('POST /api/ubicaciones', () => {
    const newUbicacionData = { nombreReferencial: 'Bodega Central', sucursalId: '550e8400-e29b-41d4-a716-446655440000', notas: 'Notas de bodega' };

    it('debe crear una ubicación si los datos son válidos y está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(GeografiaService.createUbicacion).mockResolvedValue({ ...mockUbicacion, id: 'new-id', ...newUbicacionData });
        const request = new Request('http://localhost/api/ubicaciones', {
            method: 'POST', body: JSON.stringify(newUbicacionData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await POST(request as NextRequest);
        const body = await response.json();
        expect(response.status).toBe(201);
        expect(body.nombreReferencial).toBe('Bodega Central');
        expect(GeografiaService.createUbicacion).toHaveBeenCalledWith(newUbicacionData);
    });

    it('debe devolver 400 si los datos son inválidos (ZodError)', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        const invalidData = { nombreReferencial: 'a', sucursalId: '550e8400-e29b-41d4-a716-446655440000' };
        const request = new Request('http://localhost/api/ubicaciones', {
            method: 'POST', body: JSON.stringify(invalidData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await POST(request as NextRequest);
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.message).toContain('Error de validación');
        expect(body.message).toContain('nombre referencial');
        expect(GeografiaService.createUbicacion).not.toHaveBeenCalled();
    });

    it('debe devolver 500 si el servicio de ubicaciones falla al crear por otra razón', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(GeografiaService.createUbicacion).mockRejectedValue(new Error('Error de DB al crear ubicación'));
        const request = new Request('http://localhost/api/ubicaciones', {
            method: 'POST', body: JSON.stringify(newUbicacionData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await POST(request as NextRequest);
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.message).toBe('Error de DB al crear ubicación');
    });
  });

  // --- Pruebas para /api/ubicaciones/[id] ---
  describe('GET /api/ubicaciones/[id]', () => {
    it('debe devolver una ubicación por ID si está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(GeografiaService.getUbicacionById).mockResolvedValue(mockUbicacion);
        const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`);
        const response = await getById(request, { params: { id: mockUbicacion.id } });
        const body = await response.json();
        const expectedMockUbicacion = {
          ...mockUbicacion,
          createdAt: mockUbicacion.createdAt.toISOString(),
          updatedAt: mockUbicacion.updatedAt.toISOString(),
        };
        expect(response.status).toBe(200);
        expect(body).toEqual(expectedMockUbicacion);
        expect(GeografiaService.getUbicacionById).toHaveBeenCalledWith(mockUbicacion.id);
    });

    it('debe devolver 404 si la ubicación no se encuentra', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(GeografiaService.getUbicacionById).mockResolvedValue(null);
        const request = new Request(`http://localhost/api/ubicaciones/id-no-existe`);
        const response = await getById(request, { params: { id: 'id-no-existe' } });
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.message).toBe('Ubicación no encontrada');
    });

    it('debe devolver 500 si el servicio de ubicaciones falla al obtener por ID', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(GeografiaService.getUbicacionById).mockRejectedValue(new Error('Error de DB al obtener ubicación por ID'));
        const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`);
        const response = await getById(request, { params: { id: mockUbicacion.id } });
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.message).toBe('Error de DB al obtener ubicación por ID');
    });
  });

  describe('PUT /api/ubicaciones/[id]', () => {
    const updateData = { nombreReferencial: 'Oficina Gerencia Actualizada' };

    it('debe actualizar una ubicación y devolver 200', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(GeografiaService.updateUbicacion).mockResolvedValue({ ...mockUbicacion, ...updateData });
        const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`, {
            method: 'PUT', body: JSON.stringify(updateData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await putById(request, { params: { id: mockUbicacion.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.nombreReferencial).toBe('Oficina Gerencia Actualizada');
        expect(GeografiaService.updateUbicacion).toHaveBeenCalledWith(mockUbicacion.id, updateData);
    });

    it('debe devolver 400 si los datos de actualización son inválidos (ZodError)', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        const invalidUpdateData = { nombreReferencial: 'a' }; // Nombre muy corto
        const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`, {
            method: 'PUT', body: JSON.stringify(invalidUpdateData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await putById(request, { params: { id: mockUbicacion.id } });
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.message).toContain('Error de validación');
        expect(GeografiaService.updateUbicacion).not.toHaveBeenCalled();
    });

    it('debe devolver 500 si el servicio de ubicaciones falla al actualizar por otra razón', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(GeografiaService.updateUbicacion).mockRejectedValue(new Error('Error de DB al actualizar ubicación'));
        const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`, {
            method: 'PUT', body: JSON.stringify(updateData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await putById(request, { params: { id: mockUbicacion.id } });
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.message).toBe('Error de DB al actualizar ubicación');
    });
  });

  describe('DELETE /api/ubicaciones/[id] (Desactivación)', () => {
    it('debe desactivar una ubicación y devolver 200', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(GeografiaService.deactivateUbicacion).mockResolvedValue({ ...mockUbicacion, estado: 'INACTIVA' });
        const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`, { method: 'DELETE' });
        const response = await deleteById(request, { params: { id: mockUbicacion.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.message).toBe('Ubicación desactivada exitosamente');
        expect(GeografiaService.deactivateUbicacion).toHaveBeenCalledWith(mockUbicacion.id);
    });

    it('debe devolver 400 si la ubicación tiene elementos asociados (foreign key constraint)', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        const fkError = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', { code: 'P2003', clientVersion: 'test' });
        vi.mocked(GeografiaService.deactivateUbicacion).mockRejectedValue(fkError);
        const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`, { method: 'DELETE' });
        const response = await deleteById(request, { params: { id: mockUbicacion.id } });
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.message).toBe('No se puede desactivar la ubicación debido a elementos asociados (contactos, equipos).');
    });

    it('debe devolver 500 si el servicio de ubicaciones falla al desactivar por otra razón', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(GeografiaService.deactivateUbicacion).mockRejectedValue(new Error('Error de DB al desactivar'));
        const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`, { method: 'DELETE' });
        const response = await deleteById(request, { params: { id: mockUbicacion.id } });
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.message).toBe('Error de DB al desactivar');
    });
  });
});
