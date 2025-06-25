// RUTA: src/app/api/contactos/__tests__/route.test.ts

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ContactoEmpresaService } from '@/services/contactoEmpresaService';

// --- MOCKS ---
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));
vi.mock('@/services/contactoEmpresaService');

// --- IMPORTACIÓN DEL CÓDIGO A PROBAR ---
import { GET, POST } from '../route';
import { GET as getById, PUT as putById, DELETE as deleteById } from '../[id]/route';

describe('API Endpoints para /api/contactos (Suite Completa)', () => {

  const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };
  const mockContacto = { id: 'contacto-1', nombreCompleto: 'Juan Perez', email: 'juan.perez@test.com' };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // --- Pruebas para /api/contactos ---
  describe('GET /api/contactos', () => {
    it('debe devolver 401 si el usuario no está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(null);
      const request = new Request('http://localhost/api/contactos');
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(401);
    });

    it('debe devolver una lista de contactos si el usuario está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(mockAdminSession);
      (ContactoEmpresaService.getContactosEmpresa as Mock).mockResolvedValue([mockContacto]);
      const request = new Request('http://localhost/api/contactos');
      const response = await GET(request as NextRequest);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toEqual([mockContacto]);
    });
  });

  describe('POST /api/contactos', () => {
    it('debe crear un contacto si los datos son válidos y el usuario está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        const newContactoData = { nombreCompleto: 'Ana Gomez', email: 'ana.gomez@test.com' };
        (ContactoEmpresaService.createContactoEmpresa as Mock).mockResolvedValue({ id: 'new-id', ...newContactoData });
        const request = new Request('http://localhost/api/contactos', {
            method: 'POST', body: JSON.stringify(newContactoData),
        });
        const response = await POST(request as NextRequest);
        const body = await response.json();
        expect(response.status).toBe(201);
        expect(body.nombreCompleto).toBe('Ana Gomez');
    });
  });

  // --- Pruebas para /api/contactos/[id] ---
  describe('GET /api/contactos/[id]', () => {
    it('debe devolver 401 si el usuario no está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(null);
        const request = new Request(`http://localhost/api/contactos/${mockContacto.id}`);
        const response = await getById(request as NextRequest, { params: { id: mockContacto.id } });
        expect(response.status).toBe(401);
    });

    it('debe devolver un contacto por su ID si el usuario está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (ContactoEmpresaService.getContactoEmpresaById as Mock).mockResolvedValue(mockContacto);
        const request = new Request(`http://localhost/api/contactos/${mockContacto.id}`);
        const response = await getById(request as NextRequest, { params: { id: mockContacto.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body).toEqual(mockContacto);
    });

    it('debe devolver 404 si el contacto no se encuentra', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (ContactoEmpresaService.getContactoEmpresaById as Mock).mockResolvedValue(null);
        const request = new Request(`http://localhost/api/contactos/id-que-no-existe`);
        const response = await getById(request as NextRequest, { params: { id: 'id-que-no-existe' } });
        expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/contactos/[id]', () => {
    const updateData = { nombreCompleto: 'Juan Perez Actualizado' };

    it('debe actualizar un contacto y devolver 200', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (ContactoEmpresaService.updateContactoEmpresa as Mock).mockResolvedValue({ ...mockContacto, ...updateData });
        const request = new Request(`http://localhost/api/contactos/${mockContacto.id}`, {
            method: 'PUT', body: JSON.stringify(updateData),
        });
        const response = await putById(request as NextRequest, { params: { id: mockContacto.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.nombreCompleto).toBe('Juan Perez Actualizado');
    });
  });

  describe('DELETE /api/contactos/[id]', () => {
    it('debe eliminar un contacto y devolver 200', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (ContactoEmpresaService.deleteContactoEmpresa as Mock).mockResolvedValue(undefined);
        const request = new Request(`http://localhost/api/contactos/${mockContacto.id}`, { method: 'DELETE' });
        const response = await deleteById(request as NextRequest, { params: { id: mockContacto.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.message).toBe('Contacto de empresa eliminado exitosamente');
    });

    it('debe devolver 400 si el contacto tiene tickets asociados', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        const error = new Error("No se puede eliminar porque tiene tickets asociados.");
        (ContactoEmpresaService.deleteContactoEmpresa as Mock).mockRejectedValue(error);
        const request = new Request(`http://localhost/api/contactos/${mockContacto.id}`, { method: 'DELETE' });
        const response = await deleteById(request as NextRequest, { params: { id: mockContacto.id } });
        const body = await response.json();
        expect(response.status).toBe(400);
        expect(body.message).toContain('tickets asociados');
    });
  });
});
