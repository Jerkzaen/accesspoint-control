import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { TicketService } from '@/services/ticketService';
import { Ticket, PrioridadTicket, EstadoTicket } from '@prisma/client';

// --- Mocks de Módulos ---
vi.mock('next-auth');
vi.mock('@/services/ticketService');

// --- Importación de Rutas ---
import { GET, POST } from '../route';
import { GET as getById, PUT as putById, DELETE as deleteById } from '../[id]/route';

describe('API Endpoints para /api/tickets', () => {
  const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };

  const mockTicket: Ticket = {
    id: 'ticket-test-id',
    titulo: 'Problema de Red',
    descripcionDetallada: 'La red se cae constantemente.',
    solicitanteNombre: 'Juan Perez',
    solicitanteTelefono: '912345678',
    solicitanteCorreo: 'juan.perez@example.com',
    numeroCaso: 101,
    prioridad: PrioridadTicket.ALTA,
    estado: EstadoTicket.ABIERTO,
    tipoIncidente: 'PROBLEMA_RED',
    fechaCreacion: new Date(),
    updatedAt: new Date(),
    fechaSolucionEstimada: null,
    fechaSolucionReal: null,
    empresaId: 'empresa-1',
    sucursalId: 'sucursal-1',
    contactoId: null,
    tecnicoAsignadoId: null,
    creadoPorUsuarioId: 'admin-123',
    equipoAfectado: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (getServerSession as Mock).mockResolvedValue(mockAdminSession);
  });

  // --- Pruebas para GET /api/tickets ---
  describe('GET /api/tickets', () => {
    it('debe devolver 401 si el usuario no está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(null);
      const request = new Request('http://localhost/api/tickets');
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(401);
    });

    it('debe devolver una lista de tickets si el usuario está autenticado', async () => {
      (TicketService.getTickets as Mock).mockResolvedValue([mockTicket]);
      const request = new Request('http://localhost/api/tickets');
      const response = await GET(request as NextRequest);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body[0].id).toBe(mockTicket.id);
    });
  });

  // --- Pruebas para POST /api/tickets ---
  describe('POST /api/tickets', () => {
    it('debe crear un ticket con sucursal existente y devolver 201', async () => {
        const newTicketData = { titulo: 'Nuevo Ticket', descripcionDetallada: 'Falla de impresora', sucursalId: 'suc-existente' };
        (TicketService.createTicket as Mock).mockResolvedValue({ ...mockTicket, ...newTicketData, id: 'new-id-1' });
        
        const request = new Request('http://localhost/api/tickets', {
            method: 'POST', 
            body: JSON.stringify(newTicketData),
        });
        const response = await POST(request as NextRequest);
        const body = await response.json();

        expect(response.status).toBe(201);
        expect(body.id).toBe('new-id-1');
        // Verificamos que se llamó al servicio con los datos correctos
        expect(TicketService.createTicket).toHaveBeenCalledWith(expect.objectContaining({ sucursalId: 'suc-existente' }));
    });
    
    // =================================================================
    // ===           PRUEBA CLAVE AÑADIDA                        ===
    // =================================================================
    it('debe crear un ticket y una nueva sucursal si se proveen los datos', async () => {
      const datosSucursalNueva = {
        nombre: 'Sucursal Móvil para Evento',
        comunaId: 'comuna-providencia',
        direccion: {
          calle: 'Av. El Bosque',
          numero: '500',
          depto: 'Stand 4'
        }
      };
      const newTicketData = { 
        titulo: 'Ticket con Sucursal Nueva', 
        descripcionDetallada: 'Instalar equipo en evento.',
        nuevaSucursal: datosSucursalNueva 
      };

      (TicketService.createTicket as Mock).mockResolvedValue({ ...mockTicket, ...newTicketData, id: 'new-id-2' });
      
      const request = new Request('http://localhost/api/tickets', {
          method: 'POST', 
          body: JSON.stringify(newTicketData),
      });
      const response = await POST(request as NextRequest);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.id).toBe('new-id-2');
      // Verificamos que el servicio fue llamado con el objeto 'nuevaSucursal'
      expect(TicketService.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          nuevaSucursal: datosSucursalNueva
        })
      );
    });
  });

  // --- Pruebas para /api/tickets/[id] ---
  describe('GET /api/tickets/[id]', () => {
    it('debe devolver un ticket por ID si está autenticado', async () => {
        (TicketService.getTicketById as Mock).mockResolvedValue(mockTicket);
        const request = new Request(`http://localhost/api/tickets/${mockTicket.id}`);
        const response = await getById(request, { params: { id: mockTicket.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.id).toEqual(mockTicket.id);
    });

    it('debe devolver 404 si el ticket no se encuentra', async () => {
        (TicketService.getTicketById as Mock).mockResolvedValue(null);
        const request = new Request(`http://localhost/api/tickets/id-no-existe`);
        const response = await getById(request, { params: { id: 'id-no-existe' } });
        expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/tickets/[id]', () => {
    it('debe actualizar un ticket y devolver 200', async () => {
        const updateData = { titulo: 'Ticket Actualizado Correctamente' };
        (TicketService.updateTicket as Mock).mockResolvedValue({ ...mockTicket, ...updateData });

        const request = new Request(`http://localhost/api/tickets/${mockTicket.id}`, {
            method: 'PUT', body: JSON.stringify(updateData),
        });
        const response = await putById(request, { params: { id: mockTicket.id } });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.titulo).toBe('Ticket Actualizado Correctamente');
    });
  });

  describe('DELETE /api/tickets/[id]', () => {
    it('debe eliminar un ticket y devolver 200', async () => {
        (TicketService.deleteTicket as Mock).mockResolvedValue(mockTicket);
        
        const request = new Request(`http://localhost/api/tickets/${mockTicket.id}`, { method: 'DELETE' });
        const response = await deleteById(request, { params: { id: mockTicket.id } });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.message).toBe('Ticket eliminado exitosamente');
    });

    it('debe devolver 400 si el ticket tiene préstamos asociados', async () => {
        const error = new Error("No se puede eliminar el ticket porque tiene préstamos asociados");
        (TicketService.deleteTicket as Mock).mockRejectedValue(error);

        const request = new Request(`http://localhost/api/tickets/${mockTicket.id}`, { method: 'DELETE' });
        const response = await deleteById(request, { params: { id: mockTicket.id } });
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.message).toContain('préstamos asociados');
    });
  });
});
