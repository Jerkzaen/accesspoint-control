import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
// CORRECCIÓN: Usamos el alias de ruta para el servicio
import { ContactoEmpresaService } from '@/services/contactoEmpresaService';
import { EstadoContacto } from '@prisma/client';

// --- MOCKS ---
vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
// CORRECCIÓN: Usamos el alias de ruta para el mock
vi.mock('@/services/contactoEmpresaService');

// --- IMPORTACIÓN DEL CÓDIGO A PROBAR ---
import { GET, POST } from '../route';
import { GET as getById, PUT as putById, DELETE as deleteHandler } from '../[id]/route';

describe('API Endpoints para /api/contactos', () => {
  const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };
  const VALID_CONTACTO_ID = 'c1d2e3f4-a5b6-c7d8-e9f0-a1b2c3d4e5f6';
  const mockContacto = { 
    id: VALID_CONTACTO_ID, 
    nombreCompleto: 'Juan Perez', 
    email: 'juan.perez@test.com',
    estado: EstadoContacto.ACTIVO
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (getServerSession as Mock).mockResolvedValue(mockAdminSession);
  });

  // --- Pruebas para /api/contactos ---
  describe('GET /api/contactos', () => {
    it('debe devolver una lista de contactos', async () => {
      (ContactoEmpresaService.getContactosEmpresa as Mock).mockResolvedValue([mockContacto]);
      const request = new Request('http://localhost/api/contactos');
      const response = await GET(request as NextRequest);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body[0].id).toEqual(VALID_CONTACTO_ID);
    });
  });

  describe('POST /api/contactos', () => {
    it('debe crear un contacto y devolver 201', async () => {
        const newContactoData = { nombreCompleto: 'Ana Gomez', email: 'ana.gomez@test.com', telefono: '12345678' };
        (ContactoEmpresaService.createContactoEmpresa as Mock).mockResolvedValue({ id: 'new-id', ...newContactoData, estado: EstadoContacto.ACTIVO });
        const request = new Request('http://localhost/api/contactos', {
            method: 'POST', body: JSON.stringify(newContactoData),
        });
        const response = await POST(request as NextRequest);
        const body = await response.json();
        expect(response.status).toBe(201);
        expect(body.contacto.nombreCompleto).toBe('Ana Gomez');
    });
  });

  // --- Pruebas para /api/contactos/[id] ---
  describe('GET /api/contactos/[id]', () => {
    it('debe devolver un contacto por su ID', async () => {
        (ContactoEmpresaService.getContactoEmpresaById as Mock).mockResolvedValue(mockContacto);
        const request = new Request(`http://localhost/api/contactos/${VALID_CONTACTO_ID}`);
        const response = await getById(request as NextRequest, { params: { id: VALID_CONTACTO_ID } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.id).toEqual(VALID_CONTACTO_ID);
    });
  });

  describe('PUT /api/contactos/[id]', () => {
    it('debe actualizar un contacto y devolver 200', async () => {
        const updateData = { nombreCompleto: 'Juan Perez Actualizado' };
        (ContactoEmpresaService.updateContactoEmpresa as Mock).mockResolvedValue({ ...mockContacto, ...updateData });
        const request = new Request(`http://localhost/api/contactos/${VALID_CONTACTO_ID}`, {
            method: 'PUT', body: JSON.stringify(updateData),
        });
        const response = await putById(request as NextRequest, { params: { id: VALID_CONTACTO_ID } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.nombreCompleto).toBe('Juan Perez Actualizado');
    });
  });

  describe('DELETE /api/contactos/[id]', () => {
    it('debe DESACTIVAR un contacto y devolver 200', async () => {
        (ContactoEmpresaService.deactivateContactoEmpresa as Mock).mockResolvedValue({ ...mockContacto, estado: EstadoContacto.INACTIVO });
        const request = new Request(`http://localhost/api/contactos/${VALID_CONTACTO_ID}`, { method: 'DELETE' });
        const response = await deleteHandler(request as NextRequest, { params: { id: VALID_CONTACTO_ID } });
        const body = await response.json();
        
        expect(response.status).toBe(200);
        expect(body.message).toBe('Contacto desactivado exitosamente');
        // Verificamos que se llamó al servicio correcto
        expect(ContactoEmpresaService.deactivateContactoEmpresa).toHaveBeenCalledWith(VALID_CONTACTO_ID);
    });
  });
});
