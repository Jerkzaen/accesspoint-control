// src/app/api/equipos-en-prestamo/__tests__/route.test.ts

// Importamos las funciones de las rutas API que vamos a probar
import { NextRequest } from 'next/server';
import { GET, POST } from '../route'; // Importa las funciones GET y POST de la ruta principal
import { GET as getById, PUT as putById, DELETE as deleteById } from '../[id]/route'; // Importa las funciones de la ruta con ID

// Importamos y mockeamos el EquipoEnPrestamoService para controlar su comportamiento en las pruebas de API.
import { Prisma, EstadoPrestamoEquipo, TipoEquipoInventario, EstadoEquipoInventario, PrioridadTicket, EstadoTicket, RoleUsuario } from '@prisma/client';

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/services/equipoEnPrestamoService', () => ({
  EquipoEnPrestamoService: {
    getEquiposEnPrestamo: vi.fn(),
    getEquipoEnPrestamoById: vi.fn(),
    createEquipoEnPrestamo: vi.fn(),
    updateEquipoEnPrestamo: vi.fn(),
    deleteEquipoEnPrestamo: vi.fn(),
  },
}));

import { EquipoEnPrestamoService } from '@/services/equipoEnPrestamoService';

// Casteamos el servicio mockeado
const mockEquipoEnPrestamoService = EquipoEnPrestamoService as unknown as vi.Mocked<typeof EquipoEnPrestamoService>;

describe('/api/equipos-en-prestamo', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // Datos de mock
  const mockDate = new Date();
  const mockPrestamo = {
    id: 'prestamo-test-id',
    equipoId: 'equipo-test-id',
    prestadoAContactoId: 'contacto-test-id',
    personaResponsableEnSitio: 'Responsable Préstamo Test',
    fechaPrestamo: mockDate,
    fechaDevolucionEstimada: new Date(mockDate.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 días
    fechaDevolucionReal: null,
    estadoPrestamo: EstadoPrestamoEquipo.PRESTADO,
    ticketId: 'ticket-test-id',
    notasPrestamo: 'Notas iniciales del préstamo',
    notasDevolucion: null,
    entregadoPorUsuarioId: 'user-entregado-id',
    recibidoPorUsuarioId: null,
    createdAt: mockDate,
    updatedAt: mockDate,
    // Relaciones para mocks
    equipo: {
      id: 'equipo-test-id',
      nombreDescriptivo: 'Laptop XYZ',
      identificadorUnico: 'XYZ-001',
      tipoEquipo: TipoEquipoInventario.NOTEBOOK,
      estadoEquipo: EstadoEquipoInventario.PRESTADO,
      createdAt: mockDate,
      updatedAt: mockDate,
      marca: 'MarcaTest',
      modelo: 'ModeloTest',
      descripcionAdicional: null,
      fechaAdquisicion: mockDate,
      numeroSerie: 'SN-123',
      empresaId: 'empresa-1',
      ubicacionId: null,
      ticketId: null,
      notas: null,
      proveedor: null,
      ubicacionActualId: null,
      notasGenerales: null,
      panelVtsSerie: null,
      pedalVtsSerie: null,
      fechaBaja: null,
      biarticTipoDispositivo: null,
    },
    prestadoAContacto: {
      id: 'contacto-test-id',
      nombreCompleto: 'Contacto Demo',
      email: 'demo@contacto.com',
      telefono: '123456789',
      createdAt: mockDate,
      updatedAt: mockDate,
      empresaId: 'empresa-1',
      cargo: null,
      ubicacionId: null,
    },
    ticketAsociado: {
      id: 'ticket-test-id',
      numeroCaso: 123,
      titulo: 'Problema de Equipo',
      estado: EstadoTicket.ABIERTO,
      prioridad: PrioridadTicket.ALTA,
      createdAt: mockDate,
      updatedAt: mockDate,
      fechaCreacion: mockDate,
      fechaSolucionEstimada: null,
      fechaSolucionReal: null,
      empresaId: 'empresa-1',
      descripcionDetallada: '',
      tipoIncidente: '',
      solicitanteNombre: '',
      solicitanteEmail: '',
      solicitanteTelefono: '',
      equipoAfectado: '',
      ubicacionId: null,
      notas: null,
      usuarioAsignadoId: null,
      usuarioCreadorId: null,
      solicitanteCorreo: '',
      contactoId: null,
      sucursalId: null,
      tecnicoAsignadoId: null,
      creadoPorUsuarioId: '',
    },
    entregadoPorUsuario: {
      id: 'user-entregado-id', name: 'Usuario Entregador', email: 'entregador@test.com', rol: RoleUsuario.TECNICO,
      createdAt: mockDate, updatedAt: mockDate, emailVerified: null, image: null
    },
    recibidoPorUsuario: null,
  };

  // Utilidad para convertir fechas a string en el mock de préstamo para los tests
  function prestamoMockToJson(prestamo: any) {
    // Recursivo: omite propiedades undefined y serializa fechas
    function serialize(obj: any): any {
      if (Array.isArray(obj)) return obj.map(serialize);
      if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value === undefined) continue;
          if (value instanceof Date) {
            result[key] = value.toISOString();
          } else if (typeof value === 'object' && value !== null) {
            result[key] = serialize(value);
          } else {
            result[key] = value;
          }
        }
        return result;
      }
      return obj;
    }
    return serialize(prestamo);
  }

  // --- Pruebas para GET /api/equipos-en-prestamo ---
  describe('GET', () => {
    it('debe retornar una lista de registros de préstamo con status 200', async () => {
      mockEquipoEnPrestamoService.getEquiposEnPrestamo.mockResolvedValue([mockPrestamo]);

      const response = await GET(new NextRequest('http://localhost/api/equipos-en-prestamo'));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual([prestamoMockToJson(mockPrestamo)]);
      expect(mockEquipoEnPrestamoService.getEquiposEnPrestamo).toHaveBeenCalledTimes(1);
      expect(mockEquipoEnPrestamoService.getEquiposEnPrestamo).toHaveBeenCalledWith(true); // Esperamos que incluya relaciones por defecto
    });

    it('debe manejar errores y retornar status 500', async () => {
      mockEquipoEnPrestamoService.getEquiposEnPrestamo.mockRejectedValue(new Error('Error de servicio'));

      const response = await GET(new NextRequest('http://localhost/api/equipos-en-prestamo'));
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al obtener registros de préstamo');
      expect(mockEquipoEnPrestamoService.getEquiposEnPrestamo).toHaveBeenCalledTimes(1);
    });
  });

  // --- Pruebas para POST /api/equipos-en-prestamo ---
  describe('POST', () => {
    const newPrestamoData = {
      equipoId: 'new-equipo-id',
      prestadoAContactoId: 'new-contacto-id',
      personaResponsableEnSitio: 'Nuevo Responsable',
      fechaDevolucionEstimada: new Date(),
      notasPrestamo: 'Nuevo préstamo',
      entregadoPorUsuarioId: 'user-new-id',
      ticketId: 'ticket-new-id',
    };

    it('debe crear un nuevo registro de préstamo con status 201', async () => {
      mockEquipoEnPrestamoService.createEquipoEnPrestamo.mockResolvedValue({ ...mockPrestamo, ...newPrestamoData, id: 'new-prestamo-generated-id' });

      const request = new NextRequest('http://localhost/api/equipos-en-prestamo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrestamoData),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toHaveProperty('id', 'new-prestamo-generated-id');
      expect(mockEquipoEnPrestamoService.createEquipoEnPrestamo).toHaveBeenCalledTimes(1);
      // Asegurarse de que la fechaDevolucionEstimada se pase como Date en el mock
      const expectedData = { ...newPrestamoData, fechaDevolucionEstimada: expect.any(Date) };
      expect(mockEquipoEnPrestamoService.createEquipoEnPrestamo).toHaveBeenCalledWith(expectedData);
    });

    it('debe retornar status 400 por error de validación', async () => {
      mockEquipoEnPrestamoService.createEquipoEnPrestamo.mockRejectedValue(new Error('Error de validación al crear préstamo: La persona responsable es requerida.'));

      const invalidData = { ...newPrestamoData, personaResponsableEnSitio: '' };
      const request = new NextRequest('http://localhost/api/equipos-en-prestamo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('message', 'Error de validación al crear préstamo: La persona responsable es requerida.');
    });

    it('debe manejar otros errores y retornar status 500', async () => {
      mockEquipoEnPrestamoService.createEquipoEnPrestamo.mockRejectedValue(new Error('Error desconocido'));

      const request = new NextRequest('http://localhost/api/equipos-en-prestamo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrestamoData),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al crear registro de préstamo');
    });
  });

  // --- Pruebas para GET /api/equipos-en-prestamo/[id] ---
  describe('GET /api/equipos-en-prestamo/[id]', () => {
    it('debe retornar un registro de préstamo por ID con status 200', async () => {
      mockEquipoEnPrestamoService.getEquipoEnPrestamoById.mockResolvedValue(mockPrestamo);

      const request = new NextRequest(`http://localhost/api/equipos-en-prestamo/${mockPrestamo.id}`);
      const response = await getById(request, { params: { id: mockPrestamo.id } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(prestamoMockToJson(mockPrestamo));
      expect(mockEquipoEnPrestamoService.getEquipoEnPrestamoById).toHaveBeenCalledTimes(1);
      expect(mockEquipoEnPrestamoService.getEquipoEnPrestamoById).toHaveBeenCalledWith(mockPrestamo.id);
    });

    it('debe retornar status 404 si el registro de préstamo no se encuentra', async () => {
      mockEquipoEnPrestamoService.getEquipoEnPrestamoById.mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/equipos-en-prestamo/non-existent-id`);
      const response = await getById(request, { params: { id: 'non-existent-id' } });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json).toHaveProperty('message', 'Registro de préstamo no encontrado');
    });

    it('debe manejar errores y retornar status 500', async () => {
      mockEquipoEnPrestamoService.getEquipoEnPrestamoById.mockRejectedValue(new Error('Error de servicio'));

      const request = new NextRequest(`http://localhost/api/equipos-en-prestamo/${mockPrestamo.id}`);
      const response = await getById(request, { params: { id: mockPrestamo.id } });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al obtener registro de préstamo');
    });
  });

  // --- Pruebas para PUT /api/equipos-en-prestamo/[id] ---
  describe('PUT /api/equipos-en-prestamo/[id]', () => {
    const updateData = { personaResponsableEnSitio: 'Nuevo Responsable' };

    it('debe actualizar un registro de préstamo y retornar status 200', async () => {
      mockEquipoEnPrestamoService.updateEquipoEnPrestamo.mockResolvedValue({ ...mockPrestamo, ...updateData });

      const request = new NextRequest(`http://localhost/3000/api/equipos-en-prestamo/${mockPrestamo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await putById(request, { params: { id: mockPrestamo.id } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty('personaResponsableEnSitio', 'Nuevo Responsable');
      expect(mockEquipoEnPrestamoService.updateEquipoEnPrestamo).toHaveBeenCalledTimes(1);
      expect(mockEquipoEnPrestamoService.updateEquipoEnPrestamo).toHaveBeenCalledWith({ id: mockPrestamo.id, ...updateData });
    });

    it('debe retornar status 400 por error de validación', async () => {
      mockEquipoEnPrestamoService.updateEquipoEnPrestamo.mockRejectedValue(new Error('Error de validación al actualizar préstamo: La persona responsable es requerida.'));

      const invalidData = { personaResponsableEnSitio: 'a' };
      const request = new NextRequest(`http://localhost/api/equipos-en-prestamo/${mockPrestamo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await putById(request, { params: { id: mockPrestamo.id } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('message', expect.stringContaining('Error de validación al actualizar préstamo: La persona responsable es requerida.'));
    });

    it('debe manejar otros errores y retornar status 500', async () => {
      mockEquipoEnPrestamoService.updateEquipoEnPrestamo.mockRejectedValue(new Error('Error desconocido'));

      const request = new NextRequest(`http://localhost/api/equipos-en-prestamo/${mockPrestamo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await putById(request, { params: { id: mockPrestamo.id } });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al actualizar registro de préstamo');
    });
  });

  // --- Pruebas para DELETE /api/equipos-en-prestamo/[id] ---
  describe('DELETE /api/equipos-en-prestamo/[id]', () => {
    it('debe eliminar un registro de préstamo y retornar status 200', async () => {
      mockEquipoEnPrestamoService.deleteEquipoEnPrestamo.mockResolvedValue(undefined); // El servicio devuelve void

      const request = new NextRequest(`http://localhost/api/equipos-en-prestamo/${mockPrestamo.id}`, {
        method: 'DELETE',
      });

      const response = await deleteById(request, { params: { id: mockPrestamo.id } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty('message', 'Registro de préstamo eliminado exitosamente');
      expect(mockEquipoEnPrestamoService.deleteEquipoEnPrestamo).toHaveBeenCalledTimes(1);
      expect(mockEquipoEnPrestamoService.deleteEquipoEnPrestamo).toHaveBeenCalledWith(mockPrestamo.id);
    });

    it('debe manejar errores y retornar status 500', async () => {
      mockEquipoEnPrestamoService.deleteEquipoEnPrestamo.mockRejectedValue(new Error('Error desconocido al eliminar.'));

      const request = new NextRequest(`http://localhost/api/equipos-en-prestamo/${mockPrestamo.id}`, {
        method: 'DELETE',
      });

      const response = await deleteById(request, { params: { id: mockPrestamo.id } });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al eliminar registro de préstamo');
    });
  });
});
