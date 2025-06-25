// src/app/api/tickets/__tests__/route.test.ts

// Importamos las funciones de las rutas API que vamos a probar
// Importamos directamente desde los archivos de ruta para evitar conflictos de nombres
import { TicketService } from '@/services/ticketService';

import { describe, it, expect, beforeEach, vi } from 'vitest';
vi.mock('@/services/ticketService', () => ({
  TicketService: {
    updateTicket: vi.fn(),
    getTicketById: vi.fn(),
    createTicket: vi.fn(),
    deleteTicket: vi.fn(),
    getTickets: vi.fn(),
  },
}));
const mockTicketService = TicketService as unknown as vi.Mocked<typeof TicketService>;
import { Prisma, EstadoTicket, PrioridadTicket, RoleUsuario } from '@prisma/client';


import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

import { GET as ticketsGET, POST as ticketsPOST } from '../route'; 
import { GET as ticketsByIdGET, PUT as ticketsByIdPUT, DELETE as ticketsByIdDELETE } from '../[id]/route'; 
import { GET as accionesGET, POST as accionesPOST } from '../[id]/accion/route'; 
import { PUT as accionesByIdPUT } from '../[id]/accion/[accionId]/route'; 

describe('/api/tickets', () => {


  beforeEach(() => {
    vi.restoreAllMocks();
    // Configura una sesión de usuario por defecto para las pruebas
    (getServerSession as vi.Mock).mockResolvedValue({
      user: { id: 'user-test-id', email: 'test@example.com', rol: RoleUsuario.ADMIN }, // Asumo un admin para la mayoría de tests
      expires: 'some-date'
    });
  });

  // Datos de mock
  const mockDate = new Date();
  const mockTicket = {
    id: 'ticket-test-id',
    numeroCaso: 12345,
    titulo: 'Problema con la red',
    descripcionDetallada: 'La red se cae constantemente.',
    tipoIncidente: 'Red',
    prioridad: PrioridadTicket.ALTA,
    estado: EstadoTicket.ABIERTO,
    solicitanteNombre: 'Juan Pérez',
    solicitanteTelefono: '912345678',
    solicitanteCorreo: 'juan.perez@empresa.com',
    contactoId: 'contacto-test-id',
    empresaId: 'empresa-test-id',
    sucursalId: 'sucursal-test-id',
    tecnicoAsignadoId: 'tecnico-test-id',
    creadoPorUsuarioId: 'user-test-id',
    fechaCreacion: mockDate,
    fechaSolucionEstimada: null,
    fechaSolucionReal: null,
    updatedAt: mockDate,
    equipoAfectado: null,
    contacto: {
      id: 'contacto-test-id',
      empresaId: 'empresa-test-id',
      updatedAt: mockDate,
      createdAt: mockDate,
      nombreCompleto: 'Juan Pérez',
      email: 'juan.perez@empresa.com',
      telefono: '912345678',
      cargo: null,
      ubicacionId: null,
    },
    empresa: {
      id: 'empresa-test-id',
      nombre: 'Empresa Demo',
      createdAt: mockDate,
      updatedAt: mockDate,
      email: null,
      telefono: null,
      rut: '12345678-9',
      logoUrl: null,
      direccionPrincipalId: null,
    },
    sucursal: {
      id: 'sucursal-test-id',
      nombre: 'Sucursal Demo',
      createdAt: mockDate,
      updatedAt: mockDate,
      email: null,
      telefono: null,
      direccionId: 'direccion-id',
      empresaId: 'empresa-test-id',
    },
    creadoPorUsuario: {
      id: 'user-test-id',
      name: 'Usuario Creador',
      email: 'creador@test.com',
      createdAt: mockDate,
      updatedAt: mockDate,
      emailVerified: null,
      image: null,
      rol: RoleUsuario.ADMIN,
    },
    tecnicoAsignado: {
      id: 'tecnico-test-id',
      name: 'Técnico Asignado',
      email: 'tecnico@test.com',
      createdAt: mockDate,
      updatedAt: mockDate,
      emailVerified: null,
      image: null,
      rol: RoleUsuario.TECNICO,
    },
    acciones: [],
    equiposEnPrestamo: [],
  };

  const mockAccion = {
    id: 'accion-test-id',
    ticketId: mockTicket.id,
    descripcion: 'Accion de prueba.',
    fechaAccion: mockDate,
    usuarioId: 'user-test-id',
    categoria: 'Actualizacion',
    createdAt: mockDate,
    updatedAt: mockDate,
    realizadaPor: {
      id: 'user-test-id',
      name: 'Usuario Test',
      email: 'test@example.com',
      createdAt: mockDate,
      updatedAt: mockDate,
      emailVerified: null,
    },
  };

  // Utilidad para convertir fechas a string en los mocks para los tests (igual que en tus rutas API)
  function ticketMockToJson(ticket: any) {
    const serializedTicket = {
      ...ticket,
      fechaCreacion: ticket.fechaCreacion?.toISOString?.() || ticket.fechaCreacion,
      fechaSolucionEstimada: ticket.fechaSolucionEstimada?.toISOString?.() || ticket.fechaSolucionEstimada,
      fechaSolucionReal: ticket.fechaSolucionReal?.toISOString?.() || ticket.fechaSolucionReal,
      updatedAt: ticket.updatedAt?.toISOString?.() || ticket.updatedAt,
      // Serializar relaciones anidadas si es necesario y si el select/include del servicio las devuelve
      contacto: ticket.contacto ? {
        ...ticket.contacto,
        createdAt: ticket.contacto.createdAt?.toISOString?.() || ticket.contacto.createdAt,
        updatedAt: ticket.contacto.updatedAt?.toISOString?.() || ticket.contacto.updatedAt,
      } : null,
      empresa: ticket.empresa ? {
        ...ticket.empresa,
        createdAt: ticket.empresa.createdAt?.toISOString?.() || ticket.empresa.createdAt,
        updatedAt: ticket.empresa.updatedAt?.toISOString?.() || ticket.empresa.updatedAt,
      } : null,
      sucursal: ticket.sucursal ? {
        ...ticket.sucursal,
        createdAt: ticket.sucursal.createdAt?.toISOString?.() || ticket.sucursal.createdAt,
        updatedAt: ticket.sucursal.updatedAt?.toISOString?.() || ticket.sucursal.updatedAt,
      } : null,
      creadoPorUsuario: ticket.creadoPorUsuario ? {
        ...ticket.creadoPorUsuario,
        createdAt: ticket.creadoPorUsuario.createdAt?.toISOString?.() || ticket.creadoPorUsuario.createdAt,
        updatedAt: ticket.creadoPorUsuario.updatedAt?.toISOString?.() || ticket.creadoPorUsuario.updatedAt,
        emailVerified: ticket.creadoPorUsuario.emailVerified?.toISOString?.() || ticket.creadoPorUsuario.emailVerified,
      } : null,
      tecnicoAsignado: ticket.tecnicoAsignado ? {
        ...ticket.tecnicoAsignado,
        createdAt: ticket.tecnicoAsignado.createdAt?.toISOString?.() || ticket.tecnicoAsignado.createdAt,
        updatedAt: ticket.tecnicoAsignado.updatedAt?.toISOString?.() || ticket.tecnicoAsignado.updatedAt,
        emailVerified: ticket.tecnicoAsignado.emailVerified?.toISOString?.() || ticket.tecnicoAsignado.emailVerified,
      } : null,
      // Acciones y EquiposEnPrestamo también deberían ser serializados si se devuelven en la API.
      acciones: ticket.acciones ? ticket.acciones.map((a: any) => ({
        ...a,
        fechaAccion: a.fechaAccion?.toISOString?.() || a.fechaAccion,
        createdAt: a.createdAt?.toISOString?.() || a.createdAt,
        updatedAt: a.updatedAt?.toISOString?.() || a.updatedAt,
        realizadaPor: a.realizadaPor ? {
          ...a.realizadaPor,
          createdAt: a.realizadaPor.createdAt?.toISOString?.() || a.realizadaPor.createdAt,
          updatedAt: a.realizadaPor.updatedAt?.toISOString?.() || a.realizadaPor.updatedAt,
          emailVerified: a.realizadaPor.emailVerified?.toISOString?.() || a.realizadaPor.emailVerified,
        } : null,
      })) : [],
      equiposEnPrestamo: ticket.equiposEnPrestamo ? ticket.equiposEnPrestamo.map((e: any) => ({
        ...e,
        fechaPrestamo: e.fechaPrestamo?.toISOString?.() || e.fechaPrestamo,
        fechaDevolucionEstimada: e.fechaDevolucionEstimada?.toISOString?.() || e.fechaDevolucionEstimada,
        fechaDevolucionReal: e.fechaDevolucionReal?.toISOString?.() || e.fechaDevolucionReal,
        createdAt: e.createdAt?.toISOString?.() || e.createdAt,
        updatedAt: e.updatedAt?.toISOString?.() || e.updatedAt,
        // Serializar relaciones anidadas en equiposEnPrestamo si se cargan.
        equipo: e.equipo ? {
            ...e.equipo,
            createdAt: e.equipo.createdAt?.toISOString?.() || e.equipo.createdAt,
            updatedAt: e.equipo.updatedAt?.toISOString?.() || e.equipo.updatedAt,
            fechaAdquisicion: e.equipo.fechaAdquisicion?.toISOString?.() || e.equipo.fechaAdquisicion,
        } : null,
        prestadoAContacto: e.prestadoAContacto ? {
            ...e.prestadoAContacto,
            createdAt: e.prestadoAContacto.createdAt?.toISOString?.() || e.prestadoAContacto.createdAt,
            updatedAt: e.prestadoAContacto.updatedAt?.toISOString?.() || e.prestadoAContacto.updatedAt,
        } : null,
        ticketAsociado: e.ticketAsociado ? {
            ...e.ticketAsociado,
            fechaCreacion: e.ticketAsociado.fechaCreacion?.toISOString?.() || e.ticketAsociado.fechaCreacion,
            updatedAt: e.ticketAsociado.updatedAt?.toISOString?.() || e.ticketAsociado.updatedAt,
            fechaSolucionEstimada: e.ticketAsociado.fechaSolucionEstimada?.toISOString?.() || e.ticketAsociado.fechaSolucionEstimada,
            fechaSolucionReal: e.ticketAsociado.fechaSolucionReal?.toISOString?.() || e.ticketAsociado.fechaSolucionReal,
        } : null,
        entregadoPorUsuario: e.entregadoPorUsuario ? {
          ...e.entregadoPorUsuario,
          createdAt: e.entregadoPorUsuario.createdAt?.toISOString?.() || e.entregadoPorUsuario.createdAt,
          updatedAt: e.entregadoPorUsuario.updatedAt?.toISOString?.() || e.entregadoPorUsuario.updatedAt,
          emailVerified: e.entregadoPorUsuario.emailVerified?.toISOString?.() || e.entregadoPorUsuario.emailVerified,
        } : null,
        recibidoPorUsuario: e.recibidoPorUsuario ? {
          ...e.recibidoPorUsuario,
          createdAt: e.recibidoPorUsuario.createdAt?.toISOString?.() || e.recibidoPorUsuario.createdAt,
          updatedAt: e.recibidoPorUsuario.updatedAt?.toISOString?.() || e.recibidoPorUsuario.updatedAt,
          emailVerified: e.recibidoPorUsuario.emailVerified?.toISOString?.() || e.recibidoPorUsuario.emailVerified,
        } : null,
      })) : [],
    };
    return serializedTicket;
  }

  // --- Pruebas para GET /api/tickets ---
  describe('GET', () => {
    it('debe retornar una lista de tickets con status 200 para un admin', async () => {
      (mockTicketService.getTickets as ReturnType<typeof mock>).mockResolvedValue([mockTicket]);
      (getServerSession as ReturnType<typeof mock>).mockResolvedValueOnce({ user: { id: 'user1', rol: RoleUsuario.ADMIN } });

      const response = await ticketsGET(new NextRequest('http://localhost/api/tickets'));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual([ticketMockToJson(mockTicket)]);
      expect(mockTicketService.getTickets).toHaveBeenCalledTimes(1);
      // Asume que la API filtra y ordena correctamente, solo verificamos que se llama al servicio
    });

    it('debe manejar errores y retornar status 500', async () => {
      (mockTicketService.getTickets as ReturnType<typeof mock>).mockRejectedValue(new Error('Error de servicio'));
      (getServerSession as ReturnType<typeof mock>).mockResolvedValueOnce({ user: { id: 'user1', rol: RoleUsuario.ADMIN } });

      const response = await ticketsGET(new NextRequest('http://localhost/api/tickets'));
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error interno del servidor');
    });

    it('debe retornar status 401 si no hay sesión', async () => {
      (getServerSession as ReturnType<typeof mock>).mockResolvedValueOnce(null);

      const response = await ticketsGET(new NextRequest('http://localhost/api/tickets'));
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json).toHaveProperty('message', 'No autorizado');
    });
  });

  // --- Pruebas para POST /api/tickets ---
  describe('POST', () => {
    const newTicketData = {
      numeroCaso: 12346,
      titulo: 'Nuevo ticket de prueba',
      descripcionDetallada: 'Detalles del nuevo ticket.',
      tipoIncidente: 'Software',
      prioridad: PrioridadTicket.MEDIA,
      estado: EstadoTicket.ABIERTO,
      solicitanteNombre: 'Carlos Solicitante',
      solicitanteTelefono: '911111111',
      solicitanteCorreo: 'carlos@test.com',
      empresaId: 'empresa-post-id',
      sucursalId: 'sucursal-post-id',
      creadoPorUsuarioId: 'user-post-id',
      tecnicoAsignadoId: 'tecnico-post-id',
      fechaCreacion: mockDate.toISOString(), // Convertir a string para el input
      fechaSolucionEstimada: null,
      equipoAfectado: null,
      equipoPrestamo: {
        equipoId: 'eq-prest-id',
        prestadoAContactoId: 'cont-prest-id',
        personaResponsableEnSitio: 'Resp Site',
        fechaDevolucionEstimada: mockDate.toISOString(), // Convertir a string
        notasPrestamo: 'Notas prest',
      }
    };
    const mockCreatedTicket = { ...mockTicket, ...newTicketData, id: 'new-ticket-id' };

    it('debe crear un nuevo ticket con status 201', async () => {
      (mockTicketService.createTicket as ReturnType<typeof mock>).mockResolvedValue(mockCreatedTicket);

      const request = new NextRequest('http://localhost/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicketData),
      });

      const response = await ticketsPOST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toEqual(ticketMockToJson(mockCreatedTicket));
      expect(mockTicketService.createTicket).toHaveBeenCalledTimes(1);
      // Ajustar la expectativa de fechaDevolucionEstimada para el mock de servicio si viene del frontend
      const expectedCreateData = {
          ...newTicketData,
          fechaCreacion: expect.any(Date), // El servicio espera un Date object
          equipoPrestamo: { ...newTicketData.equipoPrestamo!, fechaDevolucionEstimada: expect.any(Date) } // El servicio espera un Date object
      };
      expect(mockTicketService.createTicket).toHaveBeenCalledWith(expectedCreateData);
    });

    it('debe retornar status 400 si faltan campos obligatorios', async () => {
      mockTicketService.createTicket.mockRejectedValue(new Error('Faltan campos obligatorios.')); // El servicio podría lanzar esto

      const invalidData = { ...newTicketData, titulo: '' }; // Título vacío para simular falta de campo
      const request = new NextRequest('http://localhost/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await ticketsPOST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('message', 'Faltan campos obligatorios.');
    });

    it('debe retornar status 409 por numeroCaso duplicado', async () => {
      (mockTicketService.createTicket as ReturnType<typeof mock>).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }));

      const request = new NextRequest('http://localhost/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicketData),
      });

      const response = await ticketsPOST(request);
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json).toHaveProperty('message', 'Error al crear ticket: El número de caso ya existe.');
    });

    it('debe manejar otros errores y retornar status 500', async () => {
      (mockTicketService.createTicket as ReturnType<typeof mock>).mockRejectedValue(new Error('Error desconocido'));

      const request = new NextRequest('http://localhost/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicketData),
      });

      const response = await ticketsPOST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al crear ticket');
    });
  });

  // --- Pruebas para GET /api/tickets/[id] ---
  describe('GET /api/tickets/[id]', () => {
    it('debe retornar un ticket por ID con status 200', async () => {
      (mockTicketService.getTicketById as ReturnType<typeof mock>).mockResolvedValue(mockTicket);

      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}`);
      const response = await ticketsByIdGET(request, { params: { id: mockTicket.id } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(ticketMockToJson(mockTicket));
      expect(mockTicketService.getTicketById).toHaveBeenCalledTimes(1);
      expect(mockTicketService.getTicketById).toHaveBeenCalledWith(mockTicket.id);
    });

    it('debe retornar status 404 si el ticket no se encuentra', async () => {
      (mockTicketService.getTicketById as ReturnType<typeof mock>).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/tickets/non-existent-id`);
      const response = await ticketsByIdGET(request, { params: { id: 'non-existent-id' } });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json).toHaveProperty('message', 'No se encontró un ticket con el ID non-existent-id');
    });

    it('debe manejar errores y retornar status 500', async () => {
      (mockTicketService.getTicketById as ReturnType<typeof mock>).mockRejectedValue(new Error('Error al obtener acciones'));

      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}`);
      const response = await ticketsByIdGET(request, { params: { id: mockTicket.id } });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al obtener el ticket');
    });
  });

  // --- Pruebas para PUT /api/tickets/[id] ---
  describe('PUT /api/tickets/[id]', () => {
    const updateData = { titulo: 'Ticket Actualizado', estado: EstadoTicket.EN_PROGRESO };

    it('debe actualizar un ticket y retornar status 200', async () => {
      (mockTicketService.updateTicket as ReturnType<typeof mock>).mockResolvedValue({ ...mockTicket, ...updateData });

      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await ticketsByIdPUT(request, { params: { id: mockTicket.id } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty('titulo', 'Ticket Actualizado');
      expect(json).toHaveProperty('estado', EstadoTicket.EN_PROGRESO);
      expect(mockTicketService.updateTicket).toHaveBeenCalledTimes(1);
      expect(mockTicketService.updateTicket).toHaveBeenCalledWith({ id: mockTicket.id, ...updateData });
    });

    it('debe retornar status 400 por error de validación', async () => {
      mockTicketService.updateTicket.mockRejectedValue(new Error('Error al actualizar el ticket. Detalles: El título es obligatorio.'));

      const invalidData = { titulo: '' };
      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await ticketsByIdPUT(request, { params: { id: mockTicket.id } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('message', 'Error al actualizar el ticket. Detalles: El título es obligatorio.');
    });

    it('debe manejar otros errores y retornar status 500', async () => {
      (mockTicketService.updateTicket as ReturnType<typeof mock>).mockRejectedValue(new Error('Error al actualizar ticket'));

      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await ticketsByIdPUT(request, { params: { id: mockTicket.id } });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al actualizar el ticket');
    });
  });

  // --- Pruebas para DELETE /api/tickets/[id] ---
  describe('DELETE /api/tickets/[id]', () => {
    it('debe eliminar un ticket y retornar status 200', async () => {
      (mockTicketService.deleteTicket as ReturnType<typeof mock>).mockResolvedValue(mockTicket);

      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}`, {
        method: 'DELETE',
      });

      const response = await ticketsByIdDELETE(request, { params: { id: mockTicket.id } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty('message', 'Ticket eliminado exitosamente');
      expect(mockTicketService.deleteTicket).toHaveBeenCalledTimes(1);
      expect(mockTicketService.deleteTicket).toHaveBeenCalledWith(mockTicket.id);
    });

    it('debe retornar status 400 por error de regla de negocio', async () => {
      (mockTicketService.deleteTicket as ReturnType<typeof mock>).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Record not found', { code: 'P2025', clientVersion: '1.0' }));

      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}`, {
        method: 'DELETE',
      });

      const response = await ticketsByIdDELETE(request, { params: { id: mockTicket.id } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('message', 'No se puede eliminar el ticket porque tiene préstamos asociados.');
    });

    it('debe manejar otros errores y retornar status 500', async () => {
      (mockTicketService.deleteTicket as ReturnType<typeof mock>).mockRejectedValue(new Error('Error al eliminar ticket'));

      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}`, {
        method: 'DELETE',
      });

      const response = await ticketsByIdDELETE(request, { params: { id: mockTicket.id } });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al eliminar ticket');
    });
  });

  // --- Pruebas para GET /api/tickets/[id]/accion ---
  describe('GET /api/tickets/[id]/accion', () => {
    it('debe retornar las acciones de un ticket con status 200', async () => {
      mockTicketService.getAccionesByTicketId.mockResolvedValue([mockAccion]);

      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}/accion`);
      const response = await accionesGET(request, { params: { id: mockTicket.id } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual([ticketMockToJson(mockAccion)]); // Usamos el serializador general
      expect(mockTicketService.getAccionesByTicketId).toHaveBeenCalledTimes(1);
      expect(mockTicketService.getAccionesByTicketId).toHaveBeenCalledWith(mockTicket.id);
    });

    it('debe manejar errores y retornar status 500', async () => {
      mockTicketService.getAccionesByTicketId.mockRejectedValue(new Error('Error de servicio'));

      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}/accion`);
      const response = await accionesGET(request, { params: { id: mockTicket.id } });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error interno del servidor al obtener acciones.');
    });
  });

  // --- Pruebas para POST /api/tickets/[id]/accion ---
  describe('POST /api/tickets/[id]/accion', () => {
    const newAccionData = { descripcion: 'Nueva acción agregada.', usuarioId: 'user-test-id', categoria: 'Seguimiento' };

    it('debe crear una nueva acción para un ticket con status 201', async () => {
      (mockTicketService.addAccionToTicket as ReturnType<typeof mock>).mockResolvedValue(mockAccion);

      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}/accion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccionData),
      });

      const response = await accionesPOST(request, { params: { id: mockTicket.id } });
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toHaveProperty('message', 'Acción agregada con éxito.');
      expect(mockTicketService.addAccionToTicket).toHaveBeenCalledTimes(1);
      expect(mockTicketService.addAccionToTicket).toHaveBeenCalledWith({ ...newAccionData, ticketId: mockTicket.id });
    });

    it('debe retornar status 400 si la descripción está vacía', async () => {
      const invalidData = { descripcion: '', usuarioId: 'user-test-id' };
      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}/accion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await accionesPOST(request, { params: { id: mockTicket.id } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('message', 'La descripción de la acción es obligatoria.');
    });

    it('debe retornar status 401 si no hay usuario autenticado', async () => {
      (getServerSession as ReturnType<typeof mock>).mockResolvedValueOnce(null); // Simula que no hay sesión

      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}/accion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccionData),
      });

      const response = await accionesPOST(request, { params: { id: mockTicket.id } });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json).toHaveProperty('message', 'Usuario no autenticado.');
    });

    it('debe retornar status 404 si el ticket no existe (error P2003)', async () => {
      (mockTicketService.addAccionToTicket as ReturnType<typeof mock>).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', { code: 'P2003', clientVersion: '1.0' }));

      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}/accion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccionData),
      });

      const response = await accionesPOST(request, { params: { id: mockTicket.id } });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json).toHaveProperty('message', expect.stringContaining('No existe.')); // Mensaje esperado del servicio
    });

    it('debe manejar otros errores y retornar status 500', async () => {
      (mockTicketService.addAccionToTicket as ReturnType<typeof mock>).mockRejectedValue(new Error('Error al añadir acción'));

      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}/accion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccionData),
      });

      const response = await accionesPOST(request, { params: { id: mockTicket.id } });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al agregar la acción al ticket.');
    });
  });

  // --- Pruebas para PUT /api/tickets/[id]/accion/[accionId] ---
  describe('PUT /api/tickets/[id]/accion/[accionId]', () => {
    const updateAccionData = { descripcion: 'Descripción de acción actualizada.' };
    const mockUpdatedTicketAfterAccionUpdate = { ...mockTicket, acciones: [{ ...mockAccion, descripcion: updateAccionData.descripcion }] };

    it('debe actualizar una acción de ticket y retornar el ticket actualizado con status 200', async () => {
      // Ajustamos los mocks para lo que la API [accionId]/route.ts realmente hace:
      // 1. Llama a TicketService.updateTicket para actualizar la acción (en este caso, simulamos la actualización en el mock)
      //    Nota: El TicketService.updateTicket no tiene `acciones` en su input, esto es un proxy a `prisma.accionTicket.update`.
      //    Aquí mockeamos la llamada interna que el servicio TicketService haría si tuviera el método.
      //    Dado que la ruta llama a TicketService.updateTicket con un `as any`, necesitamos mockearlo.
      mockTicketService.updateTicket.mockResolvedValue(mockTicket); // El servicio no devuelve la acción, sino el ticket actualizado
      // 2. Luego la ruta llama a TicketService.getTicketById para obtener el ticket completo y devolverlo.
      mockTicketService.getTicketById.mockResolvedValue(mockUpdatedTicketAfterAccionUpdate);

      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}/accion/${mockAccion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateAccionData),
      });

      const response = await accionesByIdPUT(request, { params: { id: mockTicket.id, accionId: mockAccion.id } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(ticketMockToJson(mockUpdatedTicketAfterAccionUpdate));
      // Verificamos la llamada a updateTicket con la estructura que se le pasa
      expect(mockTicketService.updateTicket).toHaveBeenCalledTimes(1);
      expect(mockTicketService.updateTicket).toHaveBeenCalledWith({ 
        id: mockTicket.id, 
        // La ruta pasa la acción anidada como un array, que el servicio luego debería procesar.
        // Asumiendo que `TicketService.updateTicket` puede manejar `acciones` en su input de esta forma.
        // Si no, esta aserción del `toHaveBeenCalledWith` necesitaría ser ajustada a cómo el servicio lo espera.
        acciones: expect.arrayContaining([
            expect.objectContaining({
                id: mockAccion.id,
                descripcion: updateAccionData.descripcion
            })
        ])
      });
      // Verificamos la llamada a getTicketById
      expect(mockTicketService.getTicketById).toHaveBeenCalledTimes(1);
      expect(mockTicketService.getTicketById).toHaveBeenCalledWith(mockTicket.id);
    });

    it('debe retornar status 400 si la descripción está vacía', async () => {
      const invalidData = { descripcion: '' };
      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}/accion/${mockAccion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await accionesByIdPUT(request, { params: { id: mockTicket.id, accionId: mockAccion.id } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('message', 'La descripción de la acción no puede estar vacía.');
    });

    it('debe retornar status 404 si la acción o ticket no se encuentran', async () => {
      (mockTicketService.updateTicket as ReturnType<typeof mock>).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Record not found', { code: 'P2025', clientVersion: 'test' }));

      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}/accion/${mockAccion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateAccionData),
      });

      const response = await accionesByIdPUT(request, { params: { id: mockTicket.id, accionId: mockAccion.id } });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json).toHaveProperty('message', `No se encontró la acción con el ID ${mockAccion.id} para el ticket ${mockTicket.id}`);
    });

    it('debe manejar otros errores y retornar status 500', async () => {
      mockTicketService.updateTicket.mockRejectedValue(new Error('Error desconocido'));

      const request = new NextRequest(`http://localhost/api/tickets/${mockTicket.id}/accion/${mockAccion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateAccionData),
      });

      const response = await accionesByIdPUT(request, { params: { id: mockTicket.id, accionId: mockAccion.id } });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al editar la acción.');
    });
  });
});
