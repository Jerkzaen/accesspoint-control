// RUTA: src/app/api/equipos-en-prestamo/__tests__/route.test.ts

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { EquipoEnPrestamoService } from '@/services/equipoEnPrestamoService';
import { EstadoPrestamoEquipo } from '@prisma/client';

// --- MOCKS ---
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));
vi.mock('@/services/equipoEnPrestamoService');

// --- IMPORTACIÓN DEL CÓDIGO A PROBAR ---
import { GET, POST } from '../route';
// Si tienes una ruta [id], descomenta la siguiente línea
// import { GET as getById, PUT as putById, DELETE as deleteById } from '../[id]/route';

describe('API Endpoints para /api/equipos-en-prestamo (Suite Completa)', () => {

  const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };
  const mockPrestamo = {
    id: 'prestamo-test-id',
    equipoId: 'equipo-test-id',
    prestadoAContactoId: 'contacto-test-id',
    personaResponsableEnSitio: 'Responsable de Prueba',
    fechaPrestamo: new Date(),
    fechaDevolucionEstimada: new Date(),
    estadoPrestamo: EstadoPrestamoEquipo.PRESTADO,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // --- Pruebas para GET /api/equipos-en-prestamo ---
  describe('GET /api/equipos-en-prestamo', () => {
    it('debe devolver 401 si el usuario no está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(null);
      const request = new Request('http://localhost/api/equipos-en-prestamo');
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(401);
    });

    it('debe devolver una lista de préstamos si el usuario está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(mockAdminSession);
      (EquipoEnPrestamoService.getEquiposEnPrestamo as Mock).mockResolvedValue([mockPrestamo]);
      
      const request = new Request('http://localhost/api/equipos-en-prestamo');
      const response = await GET(request as NextRequest);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body[0].id).toEqual(mockPrestamo.id);
    });
  });

  // --- Pruebas para POST /api/equipos-en-prestamo ---
  describe('POST /api/equipos-en-prestamo', () => {
    const newPrestamoData = {
      equipoId: 'new-equipo-id',
      prestadoAContactoId: 'new-contacto-id',
      personaResponsableEnSitio: 'Nuevo Responsable',
      fechaDevolucionEstimada: new Date(),
    };

    it('debe devolver 401 si el usuario no está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(null);
        const request = new Request('http://localhost/api/equipos-en-prestamo', {
            method: 'POST', body: JSON.stringify(newPrestamoData),
        });
        const response = await POST(request as NextRequest);
        expect(response.status).toBe(401);
    });

    it('debe crear un préstamo si los datos son válidos y el usuario está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (EquipoEnPrestamoService.createEquipoEnPrestamo as Mock).mockResolvedValue({ ...mockPrestamo, ...newPrestamoData, id: 'new-id' });
        
        const request = new Request('http://localhost/api/equipos-en-prestamo', {
            method: 'POST', body: JSON.stringify(newPrestamoData),
        });
        
        const response = await POST(request as NextRequest);
        const body = await response.json();
        
        expect(response.status).toBe(201);
        expect(body.personaResponsableEnSitio).toBe('Nuevo Responsable');
    });
  });

  // Si tienes una ruta [id], puedes añadir los tests aquí. Ejemplo:
  /*
  describe('GET /api/equipos-en-prestamo/[id]', () => {
    it('debe devolver un préstamo por ID', async () => {
      // Tu lógica de prueba aquí
    });
  });
  */
});
