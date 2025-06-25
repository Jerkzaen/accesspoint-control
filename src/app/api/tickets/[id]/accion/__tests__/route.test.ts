// RUTA: src/app/api/tickets/[id]/accion/[accionId]/__tests__/route.test.ts

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { TicketService } from '@/services/ticketService';

// --- MOCKS ---
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

// Actualizamos el mock del servicio para incluir los nuevos métodos
vi.mock('@/services/ticketService', () => ({
  TicketService: {
    getTickets: vi.fn(),
    createTicket: vi.fn(),
    getTicketById: vi.fn(),
    updateTicket: vi.fn(),
    deleteTicket: vi.fn(),
    getAccionesByTicketId: vi.fn(),
    addAccionToTicket: vi.fn(),
    updateAccion: vi.fn(), // Nuevo método
    deleteAccion: vi.fn(), // Nuevo método
  }
}));

// --- IMPORTACIÓN DEL CÓDIGO A PROBAR ---
import { PUT, DELETE } from '../route';

describe('API Endpoints para /api/tickets/[id]/accion/[accionId]', () => {

  const mockAdminSession = { user: { id: 'admin-123' } };
  const mockAccionId = 'accion-test-id';
  const mockAccion = { id: mockAccionId, descripcion: 'Acción original' };

  beforeEach(() => {
    vi.resetAllMocks();
    (getServerSession as Mock).mockResolvedValue(mockAdminSession);
  });

  // --- Pruebas para PUT ---
  describe('PUT', () => {
    it('debe actualizar una acción y devolver 200', async () => {
      const updateData = { descripcion: 'Descripción actualizada' };
      (TicketService.updateAccion as Mock).mockResolvedValue({ ...mockAccion, ...updateData });

      const request = new Request(`http://localhost/api/tickets/any/accion/${mockAccionId}`, {
        method: 'PUT', body: JSON.stringify(updateData),
      });
      const response = await PUT(request as NextRequest, { params: { accionId: mockAccionId } });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.descripcion).toBe('Descripción actualizada');
      expect(TicketService.updateAccion).toHaveBeenCalledWith(mockAccionId, updateData);
    });

     it('debe devolver 401 si el usuario no está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(null);
      const request = new Request(`http://localhost/api/tickets/any/accion/${mockAccionId}`, { method: 'PUT', body: '{}' });
      const response = await PUT(request as NextRequest, { params: { accionId: mockAccionId } });
      expect(response.status).toBe(401);
    });
  });

  // --- Pruebas para DELETE ---
  describe('DELETE', () => {
    it('debe eliminar una acción y devolver 200', async () => {
      (TicketService.deleteAccion as Mock).mockResolvedValue(undefined);
      const request = new Request(`http://localhost/api/tickets/any/accion/${mockAccionId}`, { method: 'DELETE' });
      const response = await DELETE(request as NextRequest, { params: { accionId: mockAccionId } });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.message).toBe('Acción eliminada exitosamente.');
      expect(TicketService.deleteAccion).toHaveBeenCalledWith(mockAccionId);
    });
  });
});
