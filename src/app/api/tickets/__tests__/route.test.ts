// RUTA: src/app/api/tickets/__tests__/route.test.ts

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { TicketService } from '@/services/ticketService';
import { EstadoTicket, PrioridadTicket } from '@prisma/client';

// --- MOCKS ---
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));
vi.mock('@/services/ticketService');

// --- IMPORTACIÓN DEL CÓDIGO A PROBAR ---
// Importamos los handlers de AMBAS rutas
import { GET, POST } from '../route';
import { GET as getById, PUT as putById, DELETE as deleteById } from '../[id]/route';

describe('API Endpoints para /api/tickets (Suite Completa)', () => {

  const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };
  const mockTicket = {
    id: 'ticket-test-id',
    numeroCaso: 12345,
    titulo: 'Problema con la red',
    prioridad: PrioridadTicket.ALTA,
    estado: EstadoTicket.ABIERTO,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // --- Pruebas para /api/tickets ---
  describe('GET /api/tickets', () => {
    it('debe devolver 401 si el usuario no está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(null);
      const request = new Request('http://localhost/api/tickets');
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(401);
    });

    it('debe devolver una lista de tickets si el usuario está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(mockAdminSession);
      (TicketService.getTickets as Mock).mockResolvedValue([mockTicket]);
      const request = new Request('http://localhost/api/tickets');
      const response = await GET(request as NextRequest);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body[0].id).toEqual(mockTicket.id);
    });
  });

  describe('POST /api/tickets', () => {
    const newTicketData = { titulo: 'Nuevo ticket', solicitanteNombre: 'Ana' };
    it('debe crear un ticket y devolver 201 si está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (TicketService.createTicket as Mock).mockResolvedValue({ ...mockTicket, ...newTicketData, id: 'new-id' });
        const request = new Request('http://localhost/api/tickets', {
            method: 'POST', body: JSON.stringify(newTicketData),
        });
        const response = await POST(request as NextRequest);
        const body = await response.json();
        expect(response.status).toBe(201);
        expect(body.titulo).toBe('Nuevo ticket');
    });
  });

  // --- Pruebas para /api/tickets/[id] ---
  describe('GET /api/tickets/[id]', () => {
    it('debe devolver un ticket por ID si está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (TicketService.getTicketById as Mock).mockResolvedValue(mockTicket);
        const request = new Request(`http://localhost/api/tickets/${mockTicket.id}`);
        const response = await getById(request, { params: { id: mockTicket.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body).toEqual(mockTicket);
    });

    it('debe devolver 404 si el ticket no se encuentra', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (TicketService.getTicketById as Mock).mockResolvedValue(null);
        const request = new Request(`http://localhost/api/tickets/id-no-existe`);
        const response = await getById(request, { params: { id: 'id-no-existe' } });
        expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/tickets/[id]', () => {
    const updateData = { titulo: 'Ticket Actualizado Correctamente' };
    it('debe actualizar un ticket y devolver 200', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
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
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        (TicketService.deleteTicket as Mock).mockResolvedValue(undefined); // delete no devuelve nada
        const request = new Request(`http://localhost/api/tickets/${mockTicket.id}`, { method: 'DELETE' });
        const response = await deleteById(request, { params: { id: mockTicket.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.message).toBe('Ticket eliminado exitosamente');
    });

    it('debe devolver 400 si el ticket tiene préstamos asociados', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
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
