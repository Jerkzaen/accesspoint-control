// RUTA: src/app/api/empresas/__tests__/route.test.ts

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { EmpresaService } from '@/services/empresaService';

// --- MOCKS ---
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));
vi.mock('@/services/empresaService');

// --- IMPORTACIÓN DEL CÓDIGO A PROBAR ---
// Importamos los handlers de AMBOS archivos de ruta
import { GET, POST } from '../route';
import { GET as getById, PUT as putById, DELETE as deleteById } from '../[id]/route';

describe('API Endpoints para /api/empresas (Suite Completa)', () => {

  const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };
  const mockEmpresa = { id: 'empresa-1', nombre: 'Empresa Fantástica', rut: '76.123.456-7' };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // --- Pruebas para la ruta principal: /api/empresas ---
  describe('GET /api/empresas', () => {
    it('debe devolver 401 si el usuario no está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(null);
      const request = new Request('http://localhost/api/empresas');
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(401);
    });

    it('debe devolver una lista de empresas si el usuario está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(mockAdminSession);
      (EmpresaService.getEmpresas as Mock).mockResolvedValue([mockEmpresa]);
      const request = new Request('http://localhost/api/empresas');
      const response = await GET(request as NextRequest);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toEqual([mockEmpresa]);
    });
  });

  describe('POST /api/empresas', () => {
    it('debe crear una empresa si los datos son válidos y el usuario está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        const newEmpresaData = { nombre: 'Nueva Empresa', rut: '12.345.678-9' };
        (EmpresaService.createEmpresa as Mock).mockResolvedValue({ id: 'new-id', ...newEmpresaData });
        const request = new Request('http://localhost/api/empresas', {
            method: 'POST', body: JSON.stringify(newEmpresaData),
        });
        const response = await POST(request as NextRequest);
        const body = await response.json();
        expect(response.status).toBe(201);
        expect(body.nombre).toBe('Nueva Empresa');
    });
  });

  // --- Pruebas para la ruta dinámica: /api/empresas/[id] ---
  describe('GET /api/empresas/[id]', () => {
    it('debe devolver 401 si el usuario no está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(null);
        const request = new Request(`http://localhost/api/empresas/${mockEmpresa.id}`);
        const response = await getById(request as NextRequest, { params: { id: mockEmpresa.id } });
        expect(response.status).toBe(401);
    });

    it('debe devolver una empresa por su ID si el usuario está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (EmpresaService.getEmpresaById as Mock).mockResolvedValue(mockEmpresa);
        const request = new Request(`http://localhost/api/empresas/${mockEmpresa.id}`);
        const response = await getById(request as NextRequest, { params: { id: mockEmpresa.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body).toEqual(mockEmpresa);
    });

    it('debe devolver 404 si la empresa no se encuentra', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (EmpresaService.getEmpresaById as Mock).mockResolvedValue(null); // El servicio no encuentra nada
        const request = new Request(`http://localhost/api/empresas/id-que-no-existe`);
        const response = await getById(request as NextRequest, { params: { id: 'id-que-no-existe' } });
        expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/empresas/[id]', () => {
    const updateData = { nombre: 'Empresa Actualizada' };

    it('debe actualizar una empresa y devolver 200', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (EmpresaService.updateEmpresa as Mock).mockResolvedValue({ ...mockEmpresa, ...updateData });
        const request = new Request(`http://localhost/api/empresas/${mockEmpresa.id}`, {
            method: 'PUT', body: JSON.stringify(updateData),
        });
        const response = await putById(request as NextRequest, { params: { id: mockEmpresa.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.nombre).toBe('Empresa Actualizada');
        expect(EmpresaService.updateEmpresa).toHaveBeenCalledWith(mockEmpresa.id, updateData);
    });
  });

  describe('DELETE /api/empresas/[id]', () => {
    it('debe eliminar una empresa y devolver 200', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (EmpresaService.deleteEmpresa as Mock).mockResolvedValue(undefined); // delete no devuelve nada
        const request = new Request(`http://localhost/api/empresas/${mockEmpresa.id}`, { method: 'DELETE' });
        const response = await deleteById(request as NextRequest, { params: { id: mockEmpresa.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.message).toBe('Empresa eliminada exitosamente');
    });

    it('debe devolver 400 si la empresa tiene sucursales asociadas', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        const error = new Error("No se puede eliminar la empresa porque tiene sucursales asociadas.");
        (EmpresaService.deleteEmpresa as Mock).mockRejectedValue(error);
        const request = new Request(`http://localhost/api/empresas/${mockEmpresa.id}`, { method: 'DELETE' });
        const response = await deleteById(request as NextRequest, { params: { id: mockEmpresa.id } });
        const body = await response.json();
        expect(response.status).toBe(400);
        expect(body.message).toContain('sucursales asociadas');
    });
  });
});
