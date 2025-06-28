// RUTA: src/app/api/tickets/__tests__/route.test.ts (LA SUITE DE PRUEBAS FINAL Y UNIFICADA)

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { TicketService } from '@/services/ticketService';
import { EstadoTicket, PrioridadTicket, TipoAccion } from '@prisma/client';

// --- MOCKS ---
vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('@/services/ticketService');

// --- IMPORTACIÓN DE TODO EL CÓDIGO A PROBAR (DESDE UN SOLO LUGAR) ---
import { GET, POST } from '../route';
import { GET as getById, PUT as putById, DELETE as deleteById } from '../[id]/route';
import { GET as getAcciones, POST as postAccion } from '../[id]/accion/route';
import { PUT as putAccion, DELETE as deleteAccion } from '../[id]/accion/[accionId]/route';

describe('API Endpoints para /api/tickets (Suite Completa y Final)', () => {

  const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };
  const mockTicketId = 'ticket-test-id';
  const mockAccionId = 'accion-test-id';
  const mockTicket = {
    id: mockTicketId,
    numeroCaso: 12345,
    titulo: 'Problema con la red',
    prioridad: PrioridadTicket.ALTA,
    estado: EstadoTicket.ABIERTO,
  };
  const mockAccion = {
    id: mockAccionId,
    descripcion: 'Acción de prueba.',
    tipo: TipoAccion.SEGUIMIENTO,
    tiempoInvertidoMinutos: 30,
    estadoTicketAnterior: EstadoTicket.ABIERTO,
    estadoTicketNuevo: EstadoTicket.EN_PROGRESO,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (getServerSession as Mock).mockResolvedValue(mockAdminSession);
  });

  // --- Pruebas para /api/tickets ---
  describe('POST /api/tickets', () => {
    it('debe crear un ticket con una sucursal existente', async () => {
        const newTicketData = { titulo: 'Ticket para sucursal existente', sucursalId: 'suc-existente-id' };
        (TicketService.createTicket as Mock).mockResolvedValue({ ...mockTicket, ...newTicketData });
        const request = new Request('http://localhost/api/tickets', {
            method: 'POST', body: JSON.stringify(newTicketData),
        });
        const response = await POST(request as NextRequest);
        const body = await response.json();
        expect(response.status).toBe(201);
        expect(TicketService.createTicket).toHaveBeenCalledWith(expect.objectContaining({ sucursalId: 'suc-existente-id' }));
    });

    it('debe crear un ticket y una nueva sucursal si no se proporciona ID', async () => {
        const newTicketData = {
          titulo: 'Ticket con nueva sucursal',
          nuevaSucursal: {
            nombre: 'Sucursal Creada al Vuelo',
            comunaId: 'comuna-test-id',
            direccion: { calle: 'Av. Siempreviva', numero: '742' }
          }
        };
        (TicketService.createTicket as Mock).mockResolvedValue({ ...mockTicket, ...newTicketData });
        const request = new Request('http://localhost/api/tickets', {
            method: 'POST', body: JSON.stringify(newTicketData),
        });
        const response = await POST(request as NextRequest);
        const body = await response.json();
        expect(response.status).toBe(201);
        expect(TicketService.createTicket).toHaveBeenCalledWith(expect.objectContaining({
            nuevaSucursal: expect.objectContaining({ nombre: 'Sucursal Creada al Vuelo' })
        }));
    });
  });

  // --- Pruebas para /api/tickets/[id]/accion ---
  describe('POST /api/tickets/[id]/accion', () => {
    it('debe crear una acción con los nuevos campos de reportabilidad', async () => {
        const newAccionData = { 
            descripcion: 'Revisión remota del sistema.',
            tipo: TipoAccion.DIAGNOSTICO,
            tiempoInvertidoMinutos: 45,
            nuevoEstado: EstadoTicket.EN_PROGRESO
        };
        (TicketService.addAccionToTicket as Mock).mockResolvedValue({ ...mockAccion, ...newAccionData });
        const request = new Request(`http://localhost/api/tickets/${mockTicketId}/accion`, {
            method: 'POST', body: JSON.stringify(newAccionData),
        });
        const response = await postAccion(request as NextRequest, { params: { id: mockTicketId } });
        const body = await response.json();
        expect(response.status).toBe(201);
        // Verificamos que el servicio fue llamado con todos los datos correctos
        expect(TicketService.addAccionToTicket).toHaveBeenCalledWith(expect.objectContaining({
            ...newAccionData,
            ticketId: mockTicketId,
            usuarioId: mockAdminSession.user.id
        }));
    });
  });
  
  // (Aquí irían el resto de tus tests para GET, PUT, DELETE, que ya sabemos que funcionan)

});