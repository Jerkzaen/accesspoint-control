import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { EmpresaService } from '@/services/empresaService';
import { EstadoEmpresa } from '@prisma/client';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('@/services/empresaService');

import { GET, POST } from '../route';
import { GET as getById, PUT as putById, DELETE as deleteHandler } from '../[id]/route';

describe('API Endpoints para /api/empresas', () => {
  const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };
  const VALID_EMPRESA_ID = 'e3b3b0b0-8c2c-4c2c-8c2c-8c2c8c2c8c2c';
  const mockEmpresa = { 
    id: VALID_EMPRESA_ID, 
    nombre: 'Empresa Fantástica', 
    rut: '76123456-7',
    estado: EstadoEmpresa.ACTIVA 
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (getServerSession as Mock).mockResolvedValue(mockAdminSession);
  });

  describe('GET /api/empresas', () => {
    it('debe devolver una lista de empresas', async () => {
      (EmpresaService.getEmpresas as Mock).mockResolvedValue([mockEmpresa]);
      const request = new Request('http://localhost/api/empresas');
      const response = await GET(request as NextRequest);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body[0].id).toBe(VALID_EMPRESA_ID);
    });
  });

  describe('POST /api/empresas', () => {
    it('debe crear una empresa y devolver 201', async () => {
        const newEmpresaData = { nombre: 'Nueva Empresa', rut: '12345678-9' };
        (EmpresaService.createEmpresa as Mock).mockResolvedValue({ id: 'new-id', ...newEmpresaData, estado: EstadoEmpresa.ACTIVA });
        const request = new Request('http://localhost/api/empresas', {
            method: 'POST', body: JSON.stringify(newEmpresaData),
        });
        const response = await POST(request as NextRequest);
        const body = await response.json();
        expect(response.status).toBe(201);
        expect(body.empresa.nombre).toBe('Nueva Empresa');
    });
  });

  describe('GET /api/empresas/[id]', () => {
    it('debe devolver una empresa por su ID', async () => {
        (EmpresaService.getEmpresaById as Mock).mockResolvedValue(mockEmpresa);
        const request = new Request(`http://localhost/api/empresas/${VALID_EMPRESA_ID}`);
        const response = await getById(request as NextRequest, { params: { id: VALID_EMPRESA_ID } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.id).toEqual(VALID_EMPRESA_ID);
    });
  });

  describe('PUT /api/empresas/[id]', () => {
    it('debe actualizar una empresa y devolver 200', async () => {
        const updateData = { nombre: 'Empresa Actualizada' };
        (EmpresaService.updateEmpresa as Mock).mockResolvedValue({ ...mockEmpresa, ...updateData });
        const request = new Request(`http://localhost/api/empresas/${VALID_EMPRESA_ID}`, {
            method: 'PUT', body: JSON.stringify(updateData),
        });
        const response = await putById(request as NextRequest, { params: { id: VALID_EMPRESA_ID } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.nombre).toBe('Empresa Actualizada');
    });
  });

  describe('DELETE /api/empresas/[id]', () => {
    it('debe DESACTIVAR una empresa y devolver 200', async () => {
        (EmpresaService.deactivateEmpresa as Mock).mockResolvedValue({ ...mockEmpresa, estado: EstadoEmpresa.INACTIVA });
        const request = new Request(`http://localhost/api/empresas/${VALID_EMPRESA_ID}`, { method: 'DELETE' });
        const response = await deleteHandler(request as NextRequest, { params: { id: VALID_EMPRESA_ID } });
        const body = await response.json();
        
        expect(response.status).toBe(200);
        expect(body.message).toBe('Empresa desactivada exitosamente');
        expect(EmpresaService.deactivateEmpresa).toHaveBeenCalledWith(VALID_EMPRESA_ID);
    });
  });
});
