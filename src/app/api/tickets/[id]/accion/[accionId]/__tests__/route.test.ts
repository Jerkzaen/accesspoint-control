// RUTA: src/app/api/tickets/[id]/accion/[accionId]/__tests__/route.test.ts

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { TicketService } from '@/services/ticketService';
import { TipoAccion } from '@prisma/client';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('@/services/ticketService');

import { PUT, DELETE } from '../route';

describe('API Endpoints para /api/tickets/[id]/accion/[accionId]', () => {
  const mockAdminSession = { user: { id: 'admin-123' } };
  const mockAccionId = 'accion-test-id';

  beforeEach(() => {
    vi.resetAllMocks();
    (getServerSession as Mock).mockResolvedValue(mockAdminSession);
  });

  describe('PUT', () => {
    it('debe actualizar una acción y devolver 200', async () => {
      const updateData = { descripcion: 'Descripción actualizada' };
      (TicketService.updateAccion as Mock).mockResolvedValue({ id: mockAccionId, ...updateData });
      const request = new Request(`http://localhost/api/tickets/any/accion/${mockAccionId}`, {
        method: 'PUT', body: JSON.stringify(updateData),
      });
      const response = await PUT(request as NextRequest, { params: { accionId: mockAccionId } });
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.descripcion).toBe('Descripción actualizada');
    });
  });

  describe('DELETE', () => {
    it('debe eliminar una acción y devolver 200', async () => {
      (TicketService.deleteAccion as Mock).mockResolvedValue(undefined);
      const request = new Request(`http://localhost/api/tickets/any/accion/${mockAccionId}`, { method: 'DELETE' });
      const response = await DELETE(request as NextRequest, { params: { accionId: mockAccionId } });
      expect(response.status).toBe(200);
    });
  });
});