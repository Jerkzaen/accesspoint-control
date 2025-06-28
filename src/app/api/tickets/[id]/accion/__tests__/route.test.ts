import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
// CORRECCIÓN CLAVE: Importamos desde 'next-auth/next' para que coincida con la API.
import { getServerSession } from 'next-auth/next'; 
import { TicketService } from '@/services/ticketService';
import { EstadoTicket, TipoAccion } from '@prisma/client';

// --- Mocks de Módulos ---
// CORRECCIÓN CLAVE: Mockeamos la ruta correcta.
vi.mock('next-auth/next'); 
vi.mock('@/services/ticketService');

// --- Importación de Rutas ---
import { POST as postAccion, GET as getAcciones } from '../route'; 

describe('API Endpoint para CREAR y OBTENER Acciones de Tickets', () => {
  const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };
  const mockTicketId = 'ticket-valido-123';
  
  const mockAccion = {
    id: 'accion-456',
    descripcion: 'Se contactó al cliente para seguimiento.',
    tipo: TipoAccion.SEGUIMIENTO,
    fechaAccion: new Date(),
    ticketId: mockTicketId,
    realizadaPorId: 'admin-123', 
    estadoTicketAnterior: EstadoTicket.ABIERTO,
    estadoTicketNuevo: EstadoTicket.EN_PROGRESO,
    createdAt: new Date(),
    updatedAt: new Date(),
    tiempoInvertidoMinutos: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (getServerSession as Mock).mockResolvedValue(mockAdminSession);
  });
  
  describe('POST /api/tickets/[id]/accion', () => {
    it('debe crear una acción y devolver 201', async () => {
      const accionData = { descripcion: 'Nueva acción de prueba', tipo: TipoAccion.DIAGNOSTICO };
      (TicketService.addAccionToTicket as Mock).mockResolvedValue(mockAccion);

      const request = new Request(`http://localhost/api/tickets/${mockTicketId}/accion`, {
        method: 'POST', body: JSON.stringify(accionData),
      });
      const response = await postAccion(request as NextRequest, { params: { id: mockTicketId } });
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.accion.id).toBe(mockAccion.id);
    });
    
    it('debe devolver 401 si el usuario no está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(null);
      const request = new Request(`http://localhost/api/tickets/${mockTicketId}/accion`, {
        method: 'POST', body: JSON.stringify({ descripcion: 'test' }),
      });
      const response = await postAccion(request as NextRequest, { params: { id: mockTicketId } });
      expect(response.status).toBe(401);
    });

    it('debe devolver 404 si el ticketId no existe', async () => {
      const error = new Error("El ticket no existe.");
      (TicketService.addAccionToTicket as Mock).mockRejectedValue(error);
      
      const request = new Request(`http://localhost/api/tickets/id-invalido/accion`, {
        method: 'POST', body: JSON.stringify({ descripcion: 'test', tipo: TipoAccion.SEGUIMIENTO }),
      });
      const response = await postAccion(request as NextRequest, { params: { id: 'id-invalido' } });
      
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/tickets/[id]/accion', () => {
    it('debe devolver una lista de acciones para un ticket', async () => {
        (TicketService.getAccionesByTicketId as Mock).mockResolvedValue([mockAccion, mockAccion]);

        const request = new Request(`http://localhost/api/tickets/${mockTicketId}/accion`);
        const response = await getAcciones(request as NextRequest, { params: { id: mockTicketId } });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.length).toBe(2);
    });
  });
});
