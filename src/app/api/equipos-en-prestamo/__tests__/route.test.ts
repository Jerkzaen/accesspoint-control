// RUTA: src/app/api/equipos-en-prestamo/__tests__/route.test.ts

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Prisma, EquipoEnPrestamo, EstadoPrestamoEquipo, EstadoEquipoInventario, TipoEquipoInventario, PrioridadTicket, EstadoTicket, RoleUsuario } from '@prisma/client';
import { ZodError } from 'zod';

// --- MOCKS EXTERNOS ---
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

// MOCKEAR EL MÓDULO @/services/equipoEnPrestamoService.
// Las funciones mock se declaran y retornan directamente dentro de la factoría de vi.mock.
vi.mock('@/services/equipoEnPrestamoService', () => ({
    EquipoEnPrestamoService: {
        getEquiposEnPrestamo: vi.fn(),
        getEquipoEnPrestamoById: vi.fn(),
        createEquipoEnPrestamo: vi.fn(),
        updateEquipoEnPrestamo: vi.fn(),
        finalizarPrestamo: vi.fn(), // Mock para el método de finalizar préstamo
        deleteEquipoEnPrestamo: vi.fn(), // Aunque no se usa en la API, mantener mockeado si el servicio lo tiene
    },
}));

// IMPORTAR EL SERVICIO MOCKEADO DESPUÉS DE QUE HA SIDO MOCKEADO POR VITEST.
import { EquipoEnPrestamoService } from '@/services/equipoEnPrestamoService';

// --- IMPORTACIÓN DEL CÓDIGO A PROBAR ---
import { GET, POST } from '../route';
// Importar las rutas PUT, GET por ID desde el archivo [id]/route.ts
import { GET as getById, PUT as putById } from '../[id]/route';

describe('API Endpoints para /api/equipos-en-prestamo (Suite Completa)', () => {

  const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };
  
  // Mocks de entidades relacionadas
  const mockEquipoInventario = {
    id: 'equipo-test-id',
    nombreDescriptivo: 'Laptop Prueba',
    identificadorUnico: 'SN-XYZ',
    tipoEquipo: TipoEquipoInventario.NOTEBOOK,
    estadoEquipo: EstadoEquipoInventario.DISPONIBLE,
    createdAt: new Date(), updatedAt: new Date(),
    fechaAdquisicion: null, proveedor: null, ubicacionActualId: null, notasGenerales: null,
    panelVtsSerie: null, pedalVtsSerie: null, biarticTipoDispositivo: null, empresaId: null, parentEquipoId: null,
  };
  const mockContactoEmpresa = {
    id: 'contacto-test-id',
    nombreCompleto: 'Contacto Demo', email: 'demo@contacto.com', telefono: '123456789',
    cargo: null, estado: 'ACTIVO' as const, empresaId: null, ubicacionId: null, createdAt: new Date(), updatedAt: new Date(),
  };
  const mockTicket = {
    id: 'ticket-test-id',
    numeroCaso: 1, titulo: 'Ticket Demo', descripcionDetallada: null, tipoIncidente: 'Hardware',
    prioridad: PrioridadTicket.MEDIA, estado: EstadoTicket.ABIERTO, solicitanteNombre: 'Solicitante Demo',
    solicitanteTelefono: null, solicitanteCorreo: null, contactoId: null, empresaId: null, sucursalId: null,
    creadoPorUsuarioId: 'user-test-id', tecnicoAsignadoId: null, equipoAfectado: null,
    fechaCreacion: new Date(), fechaSolucionEstimada: null, fechaSolucionReal: null, updatedAt: new Date(),
  };
  const mockUser = {
    id: 'user-test-id', name: 'User Demo', email: 'user@demo.com',
    emailVerified: null, image: null, rol: RoleUsuario.TECNICO, createdAt: new Date(), updatedAt: new Date(),
  };

  const mockPrestamo: EquipoEnPrestamo = {
    id: 'prestamo-test-id',
    equipoId: mockEquipoInventario.id,
    prestadoAContactoId: mockContactoEmpresa.id,
    personaResponsableEnSitio: 'Responsable Sitio',
    fechaPrestamo: new Date('2025-06-01T10:00:00.000Z'),
    fechaDevolucionEstimada: new Date('2025-06-15T10:00:00.000Z'),
    fechaDevolucionReal: null,
    estadoPrestamo: EstadoPrestamoEquipo.PRESTADO,
    ticketId: mockTicket.id,
    notasPrestamo: 'Notas del préstamo',
    notasDevolucion: null,
    entregadoPorUsuarioId: mockUser.id,
    recibidoPorUsuarioId: null,
    createdAt: new Date('2025-06-01T09:00:00.000Z'),
    updatedAt: new Date('2025-06-01T09:00:00.000Z'),
  };

  // Mock completo con relaciones para GET por ID y listado
  const mockPrestamoWithAllRelations = {
    ...mockPrestamo,
    equipo: mockEquipoInventario,
    prestadoAContacto: mockContactoEmpresa,
    ticketAsociado: mockTicket,
    entregadoPorUsuario: mockUser,
    recibidoPorUsuario: null,
  } as any; // Usar 'as any' para evitar problemas de tipado en las pruebas


  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as Mock).mockReset(); 

    // Resetear los mocks individuales de EquipoEnPrestamoService
    vi.mocked(EquipoEnPrestamoService.getEquiposEnPrestamo).mockReset();
    vi.mocked(EquipoEnPrestamoService.getEquipoEnPrestamoById).mockReset();
    vi.mocked(EquipoEnPrestamoService.createEquipoEnPrestamo).mockReset();
    vi.mocked(EquipoEnPrestamoService.updateEquipoEnPrestamo).mockReset();
    vi.mocked(EquipoEnPrestamoService.finalizarPrestamo).mockReset();
    vi.mocked(EquipoEnPrestamoService.deleteEquipoEnPrestamo).mockReset(); // Para tests específicos de delete si se añaden
  });

  // --- Pruebas para /api/equipos-en-prestamo ---
  describe('GET /api/equipos-en-prestamo', () => {
    it('debe devolver 401 si el usuario no está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(null);
      const request = new Request('http://localhost/api/equipos-en-prestamo');
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(401);
    });

    it('debe devolver una lista de préstamos si el usuario está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(mockAdminSession);
      vi.mocked(EquipoEnPrestamoService.getEquiposEnPrestamo).mockResolvedValue([mockPrestamoWithAllRelations]); // Usar mock con relaciones
      
      const request = new Request('http://localhost/api/equipos-en-prestamo');
      const response = await GET(request as NextRequest);
      const body = await response.json();

      expect(response.status).toBe(200);
      // Las fechas de los mocks deben convertirse a ISO string para la comparación con la respuesta API
      expect(body).toEqual([
        {
          ...mockPrestamoWithAllRelations,
          fechaPrestamo: mockPrestamoWithAllRelations.fechaPrestamo.toISOString(),
          fechaDevolucionEstimada: mockPrestamoWithAllRelations.fechaDevolucionEstimada.toISOString(),
          fechaDevolucionReal: mockPrestamoWithAllRelations.fechaDevolucionReal ? mockPrestamoWithAllRelations.fechaDevolucionReal.toISOString() : null,
          createdAt: mockPrestamoWithAllRelations.createdAt.toISOString(),
          updatedAt: mockPrestamoWithAllRelations.updatedAt.toISOString(),
          // Serialización de fechas en relaciones
          equipo: {
            ...mockEquipoInventario,
            createdAt: mockEquipoInventario.createdAt.toISOString(),
            updatedAt: mockEquipoInventario.updatedAt.toISOString(),
            fechaAdquisicion: null,
          },
          prestadoAContacto: {
            ...mockContactoEmpresa,
            createdAt: mockContactoEmpresa.createdAt.toISOString(),
            updatedAt: mockContactoEmpresa.updatedAt.toISOString(),
          },
          ticketAsociado: {
            ...mockTicket,
            fechaCreacion: mockTicket.fechaCreacion.toISOString(),
            updatedAt: mockTicket.updatedAt.toISOString(),
            fechaSolucionEstimada: null,
            fechaSolucionReal: null,
          },
          entregadoPorUsuario: {
            ...mockUser,
            createdAt: mockUser.createdAt.toISOString(),
            updatedAt: mockUser.updatedAt.toISOString(),
          },
          recibidoPorUsuario: null,
        }
      ]);
      expect(EquipoEnPrestamoService.getEquiposEnPrestamo).toHaveBeenCalledWith(true);
    });

    it('debe devolver una lista de préstamos filtrados por estado si se proporciona un query param', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        // El mock debe devolver solo los préstamos que coincidan con el filtro
        vi.mocked(EquipoEnPrestamoService.getEquiposEnPrestamo).mockResolvedValue([{ ...mockPrestamoWithAllRelations, estadoPrestamo: EstadoPrestamoEquipo.PRESTADO }]);
        
        const request = new Request('http://localhost/api/equipos-en-prestamo?estado=PRESTADO');
        const response = await GET(request as NextRequest);
        const body = await response.json();
        
        expect(response.status).toBe(200);
        expect(body[0].estadoPrestamo).toBe(EstadoPrestamoEquipo.PRESTADO);
        // El servicio es llamado con `true` (includeRelations) y luego la API filtra.
        // O si actualizamos el servicio, expect(EquipoEnPrestamoService.getEquiposEnPrestamo).toHaveBeenCalledWith(true, EstadoPrestamoEquipo.PRESTADO);
        expect(EquipoEnPrestamoService.getEquiposEnPrestamo).toHaveBeenCalledWith(true);
    });

    it('debe devolver 500 si el servicio de préstamos falla al obtener', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoEnPrestamoService.getEquiposEnPrestamo).mockRejectedValue(new Error('Error de DB al obtener préstamos'));
        const request = new Request('http://localhost/api/equipos-en-prestamo');
        const response = await GET(request as NextRequest);
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.message).toBe('Error de DB al obtener préstamos');
    });
  });

  describe('POST /api/equipos-en-prestamo', () => {
    const newPrestamoData = {
      equipoId: '12345678-1234-1234-1234-123456789012', // UUID válido
      prestadoAContactoId: '12345678-1234-1234-1234-123456789013', // UUID válido
      personaResponsableEnSitio: 'Otro Responsable',
      fechaDevolucionEstimada: '2025-07-01T10:00:00.000Z',
      notasPrestamo: 'Préstamo de emergencia',
    };

    it('debe devolver 401 si el usuario no está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(null);
        const request = new Request('http://localhost/api/equipos-en-prestamo', {
            method: 'POST', body: JSON.stringify(newPrestamoData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await POST(request as NextRequest);
        expect(response.status).toBe(401);
    });

    it('debe crear un préstamo si los datos son válidos y el usuario está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        const mockCreatedPrestamo: EquipoEnPrestamo = { 
            ...mockPrestamo, 
            id: 'new-id-prestamo', 
            equipoId: newPrestamoData.equipoId,
            prestadoAContactoId: newPrestamoData.prestadoAContactoId,
            personaResponsableEnSitio: newPrestamoData.personaResponsableEnSitio,
            fechaDevolucionEstimada: new Date(newPrestamoData.fechaDevolucionEstimada), // Convertir string a Date para el mock
            notasPrestamo: newPrestamoData.notasPrestamo,
            fechaPrestamo: new Date('2025-06-29T10:00:00.000Z'), // Fecha de préstamo auto-generada
            estadoPrestamo: EstadoPrestamoEquipo.PRESTADO,
            createdAt: new Date('2025-06-29T09:00:00.000Z'),
            updatedAt: new Date('2025-06-29T09:00:00.000Z'),
        };
        vi.mocked(EquipoEnPrestamoService.createEquipoEnPrestamo).mockResolvedValue(mockCreatedPrestamo);
        
        const request = new Request('http://localhost/api/equipos-en-prestamo', {
            method: 'POST', body: JSON.stringify(newPrestamoData), headers: { 'Content-Type': 'application/json' }
        });
        
        const response = await POST(request as NextRequest);
        const body = await response.json();
        
        expect(response.status).toBe(201);
        expect(body.personaResponsableEnSitio).toBe('Otro Responsable');
        expect(EquipoEnPrestamoService.createEquipoEnPrestamo).toHaveBeenCalledWith(expect.objectContaining({
            equipoId: newPrestamoData.equipoId,
            prestadoAContactoId: newPrestamoData.prestadoAContactoId,
            personaResponsableEnSitio: newPrestamoData.personaResponsableEnSitio,
            fechaDevolucionEstimada: expect.any(Date), // El validador convierte string a Date
        }));
    });

    it('debe devolver 400 si los datos son inválidos (ZodError)', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        const invalidData = { ...newPrestamoData, personaResponsableEnSitio: 'a' }; // Nombre muy corto
        const request = new Request('http://localhost/api/equipos-en-prestamo', {
            method: 'POST', body: JSON.stringify(invalidData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await POST(request as NextRequest);
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.message).toContain('Error de validación');
        expect(body.message).toContain('persona responsable en sitio');
        expect(EquipoEnPrestamoService.createEquipoEnPrestamo).not.toHaveBeenCalled();
    });

    it('debe devolver 409 si el equipo no está disponible para préstamo', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoEnPrestamoService.createEquipoEnPrestamo).mockRejectedValue(new Error('El equipo no está disponible para préstamo.'));
        const request = new Request('http://localhost/api/equipos-en-prestamo', {
            method: 'POST', body: JSON.stringify(newPrestamoData), headers: { 'Content-Type': 'application/json' } // Usar datos válidos
        });
        const response = await POST(request as NextRequest);
        expect(response.status).toBe(409);
        const body = await response.json();
        expect(body.message).toBe('El equipo no está disponible para préstamo.');
    });

    it('debe devolver 500 si el servicio de préstamos falla al crear por otra razón', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoEnPrestamoService.createEquipoEnPrestamo).mockRejectedValue(new Error('Error de DB al crear préstamo'));
        const request = new Request('http://localhost/api/equipos-en-prestamo', {
            method: 'POST', body: JSON.stringify(newPrestamoData), headers: { 'Content-Type': 'application/json' } // Usar datos válidos
        });
        const response = await POST(request as NextRequest);
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.message).toBe('Error de DB al crear préstamo');
    });
  });

  // --- Pruebas para /api/equipos-en-prestamo/[id] ---
  describe('GET /api/equipos-en-prestamo/[id]', () => {
    it('debe devolver 401 si el usuario no está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(null);
      const request = new Request(`http://localhost/api/equipos-en-prestamo/${mockPrestamo.id}`);
      const response = await getById(request as NextRequest, { params: { id: mockPrestamo.id } });
      expect(response.status).toBe(401);
    });

    it('debe devolver un préstamo por ID si está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoEnPrestamoService.getEquipoEnPrestamoById).mockResolvedValue(mockPrestamoWithAllRelations);
        const request = new Request(`http://localhost/api/equipos-en-prestamo/${mockPrestamo.id}`);
        const response = await getById(request as NextRequest, { params: { id: mockPrestamo.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body).toEqual(expect.objectContaining({
            ...mockPrestamoWithAllRelations,
            fechaPrestamo: mockPrestamoWithAllRelations.fechaPrestamo.toISOString(),
            fechaDevolucionEstimada: mockPrestamoWithAllRelations.fechaDevolucionEstimada.toISOString(),
            fechaDevolucionReal: mockPrestamoWithAllRelations.fechaDevolucionReal ? mockPrestamoWithAllRelations.fechaDevolucionReal.toISOString() : null,
            createdAt: mockPrestamoWithAllRelations.createdAt.toISOString(),
            updatedAt: mockPrestamoWithAllRelations.updatedAt.toISOString(),                equipo: {
                    ...mockEquipoInventario,
                    createdAt: mockEquipoInventario.createdAt.toISOString(),
                    updatedAt: mockEquipoInventario.updatedAt.toISOString(),
                    fechaAdquisicion: null,
                },
            prestadoAContacto: {
                ...mockContactoEmpresa,
                createdAt: mockContactoEmpresa.createdAt.toISOString(),
                updatedAt: mockContactoEmpresa.updatedAt.toISOString(),
            },                ticketAsociado: {
                    ...mockTicket,
                    fechaCreacion: mockTicket.fechaCreacion.toISOString(),
                    updatedAt: mockTicket.updatedAt.toISOString(),
                    fechaSolucionEstimada: null,
                    fechaSolucionReal: null,
                },
            entregadoPorUsuario: {
                ...mockUser,
                createdAt: mockUser.createdAt.toISOString(),
                updatedAt: mockUser.updatedAt.toISOString(),
            },
            recibidoPorUsuario: null,
        }));
        expect(EquipoEnPrestamoService.getEquipoEnPrestamoById).toHaveBeenCalledWith(mockPrestamo.id);
    });

    it('debe devolver 404 si el registro de préstamo no se encuentra', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoEnPrestamoService.getEquipoEnPrestamoById).mockResolvedValue(null);
        const request = new Request(`http://localhost/api/equipos-en-prestamo/id-no-existe`);
        const response = await getById(request as NextRequest, { params: { id: 'id-no-existe' } });
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.message).toBe('Registro de préstamo no encontrado');
    });

    it('debe devolver 500 si el servicio de préstamos falla al obtener por ID', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoEnPrestamoService.getEquipoEnPrestamoById).mockRejectedValue(new Error('Error de DB al obtener préstamo por ID'));
        const request = new Request(`http://localhost/api/equipos-en-prestamo/${mockPrestamo.id}`);
        const response = await getById(request as NextRequest, { params: { id: mockPrestamo.id } });
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.message).toBe('Error de DB al obtener préstamo por ID');
    });
  });

  describe('PUT /api/equipos-en-prestamo/[id]', () => {
    const updateData = { personaResponsableEnSitio: 'Nuevo Contacto' };

    it('debe actualizar un registro de préstamo y devolver 200', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoEnPrestamoService.updateEquipoEnPrestamo).mockResolvedValue({ ...mockPrestamo, ...updateData });
        const request = new Request(`http://localhost/api/equipos-en-prestamo/${mockPrestamo.id}`, {
            method: 'PUT', body: JSON.stringify(updateData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await putById(request as NextRequest, { params: { id: mockPrestamo.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.personaResponsableEnSitio).toBe('Nuevo Contacto');
        expect(EquipoEnPrestamoService.updateEquipoEnPrestamo).toHaveBeenCalledWith(mockPrestamo.id, updateData);
    });

    it('debe devolver 400 si los datos de actualización son inválidos (ZodError)', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        const invalidUpdateData = { personaResponsableEnSitio: 'a' }; // Nombre muy corto
        const request = new Request(`http://localhost/api/equipos-en-prestamo/${mockPrestamo.id}`, {
            method: 'PUT', body: JSON.stringify(invalidUpdateData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await putById(request as NextRequest, { params: { id: mockPrestamo.id } });
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.message).toContain('Error de validación: La persona responsable en sitio es requerida y debe tener al menos 3 caracteres.');
        expect(EquipoEnPrestamoService.updateEquipoEnPrestamo).not.toHaveBeenCalled();
    });

    it('debe devolver 404 si el registro de préstamo no se encuentra al actualizar', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoEnPrestamoService.updateEquipoEnPrestamo).mockRejectedValue(new Error('Registro de préstamo no encontrado para actualizar.'));
        const request = new Request(`http://localhost/api/equipos-en-prestamo/id-no-existe`, {
            method: 'PUT', body: JSON.stringify(updateData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await putById(request as NextRequest, { params: { id: 'id-no-existe' } });
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.message).toBe('Registro de préstamo no encontrado para actualizar.');
    });

    it('debe devolver 500 si el servicio de préstamos falla al actualizar por otra razón', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoEnPrestamoService.updateEquipoEnPrestamo).mockRejectedValue(new Error('Error de DB al actualizar préstamo'));
        const request = new Request(`http://localhost/api/equipos-en-prestamo/${mockPrestamo.id}`, {
            method: 'PUT', body: JSON.stringify(updateData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await putById(request as NextRequest, { params: { id: mockPrestamo.id } });
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.message).toBe('Error de DB al actualizar préstamo');
    });
  });

  // NOTE: Las pruebas para POST_Finalizar se han eliminado porque esa función
  // se movió a una ruta separada /api/equipos-en-prestamo/[id]/finalizar
  // que no está implementada actualmente
});
