// RUTA: src/app/api/contactos/__tests__/route.test.ts

// 1. --- IMPORTACIONES ---
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';

// Importa los tipos necesarios, pero NO el servicio real todavía
import { Prisma } from '@prisma/client';
// CORRECCIÓN: Importamos getServerSession desde la ruta correcta
import { getServerSession } from 'next-auth/next';
import { ContactoEmpresaService } from '@/services/contactoEmpresaService';

// 2. --- MOCKS ---
// CORRECCIÓN: Apuntamos el mock a 'next-auth/next' que es lo que usa tu API.
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));
vi.mock('@/services/contactoEmpresaService');


// 3. --- IMPORTACIÓN DEL CÓDIGO A PROBAR ---
import { GET, POST } from '../route'; 
import { GET as getById, PUT as putById, DELETE as deleteById } from '../[id]/route';

// --- INICIO DE LAS PRUEBAS ---
describe('API Endpoints para /api/contactos', () => {
  const mockDate = new Date();
  const mockContacto = {
    id: 'contacto-test-id',
    nombreCompleto: 'Test Contacto',
    email: 'test@contacto.com',
  };

  const mockAdminSession = {
    user: { id: 'admin-user-123', role: 'ADMIN' },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // --- PRUEBAS PARA GET /api/contactos ---
  describe('GET /api/contactos', () => {
    it('debe devolver 401 si el usuario no está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(null);
      const request = new Request('http://localhost/api/contactos');
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(401);
    });
    
    it('debe devolver una lista de contactos con status 200 si el usuario está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(mockAdminSession);
      (ContactoEmpresaService.getContactosEmpresa as Mock).mockResolvedValue([mockContacto]);
      const request = new Request('http://localhost/api/contactos');
      const response = await GET(request as NextRequest);
      const json = await response.json();
      expect(response.status).toBe(200);
      expect(json[0].id).toBe(mockContacto.id);
      expect(ContactoEmpresaService.getContactosEmpresa).toHaveBeenCalledTimes(1);
    });
  });

  // --- PRUEBAS PARA POST /api/contactos ---
  describe('POST /api/contactos', () => {
    const newContactoData = { nombreCompleto: 'Nuevo Contacto', email: 'nuevo@test.com' };

    it('debe crear un contacto y devolver 201 si el usuario es admin', async () => {
      (getServerSession as Mock).mockResolvedValue(mockAdminSession);
      (ContactoEmpresaService.createContactoEmpresa as Mock).mockResolvedValue({ ...mockContacto, ...newContactoData });
      const request = new Request('http://localhost/api/contactos', {
        method: 'POST', body: JSON.stringify(newContactoData),
      });
      const response = await POST(request as NextRequest);
      const json = await response.json();
      expect(response.status).toBe(201);
      expect(json.nombreCompleto).toBe('Nuevo Contacto');
      expect(ContactoEmpresaService.createContactoEmpresa).toHaveBeenCalledWith(newContactoData);
    });
  });

  // El resto de las pruebas para [id] que ya pasaban, se mantienen igual...

  // --- PRUEBAS PARA GET /api/contactos/[id] ---
  describe('GET /api/contactos/[id]', () => {
    it('debe devolver un contacto por ID si el usuario está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (ContactoEmpresaService.getContactoEmpresaById as Mock).mockResolvedValue(mockContacto);
        const request = new Request(`http://localhost/api/contactos/${mockContacto.id}`);
        const response = await getById(request as NextRequest, { params: { id: mockContacto.id } });
        const json = await response.json();
        expect(response.status).toBe(200);
        expect(json.id).toBe(mockContacto.id);
    });
  });
});
