// RUTA: src/app/api/tickets/[id]/accion/__tests__/route.test.ts

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { TicketService } from '@/services/ticketService';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('@/services/ticketService');

import { GET, POST } from '../route';

describe('API Endpoints para /api/tickets/[id]/accion', () => {
  const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };
  const mockTicketId = 'ticket-test-id';
  const mockAccion = { id: 'accion-test-id', ticketId: mockTicketId, descripcion: 'Acción de prueba.'};

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET', () => {
    it('debe devolver 401 si no hay sesión', async () => {
      (getServerSession as Mock).mockResolvedValue(null);
      const request = new Request(`http://localhost/api/tickets/${mockTicketId}/accion`);
      const response = await GET(request as NextRequest, { params: { id: mockTicketId } });
      expect(response.status).toBe(401);
    });
  });

  describe('POST', () => {
    it('debe crear una acción y devolver 201', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        const newAccionData = { descripcion: 'Nueva acción creada' };
        (TicketService.addAccionToTicket as Mock).mockResolvedValue({ ...mockAccion, ...newAccionData });
        const request = new Request(`http://localhost/api/tickets/${mockTicketId}/accion`, {
            method: 'POST', body: JSON.stringify(newAccionData),
        });
        const response = await POST(request as NextRequest, { params: { id: mockTicketId } });
        expect(response.status).toBe(201);
    });
  });
});