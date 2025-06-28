import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TicketService, TicketCreateInput } from '../ticketService';
import { prisma } from '../../lib/prisma';
import { EstadoTicket, PrioridadTicket, Prisma } from '@prisma/client';

// Mock del cliente Prisma completo
vi.mock('../../lib/prisma', () => ({
  prisma: {
    ticket: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    sucursal: {
      create: vi.fn(),
    },
    direccion: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('TicketService', () => {

  // CORRECCIÓN: Usamos IDs con formato UUID válido para pasar la validación de Zod
  const VALID_USER_ID = 'd2a2a0a0-8b1b-4b1b-8b1b-8b1b8b1b8b1b';
  const VALID_EMPRESA_ID = 'e3b3b0b0-8c2c-4c2c-8c2c-8c2c8c2c8c2c';
  const VALID_SUCURSAL_ID = 'f4c4c0c0-8d3d-4d3d-8d3d-8d3d8d3d8d3d';
  const VALID_COMUNA_ID = 'a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6';


  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe crear un ticket con una sucursal existente', async () => {
    const inputData: TicketCreateInput = {
      titulo: "Test Ticket",
      descripcionDetallada: "Descripción de prueba",
      creadoPorUsuarioId: VALID_USER_ID,
      sucursalId: VALID_SUCURSAL_ID,
      empresaId: VALID_EMPRESA_ID,
      prioridad: PrioridadTicket.MEDIA,
      estado: EstadoTicket.ABIERTO,
      tipoIncidente: "PROBLEMA_SOFTWARE",
      solicitanteNombre: "Solicitante",
      solicitanteCorreo: "solicitante@test.com",
      solicitanteTelefono: "123456789",
    };

    const mockTicket = { id: 'a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d7', ...inputData };
    
    vi.spyOn(prisma.ticket, 'count').mockResolvedValue(0);
    vi.spyOn(prisma.ticket, 'create').mockResolvedValue(mockTicket as any);
    
    const result = await TicketService.createTicket(inputData);

    expect(prisma.ticket.create).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(result.sucursalId).toBe(VALID_SUCURSAL_ID);
  });

  it('debe crear una nueva sucursal y un ticket cuando se proveen los datos para ello', async () => {
    const inputData: TicketCreateInput = {
      titulo: "Ticket para Sucursal Nueva",
      descripcionDetallada: "Instalación en nueva ubicación",
      creadoPorUsuarioId: VALID_USER_ID,
      empresaId: VALID_EMPRESA_ID,
      prioridad: PrioridadTicket.ALTA,
      estado: EstadoTicket.ABIERTO,
      tipoIncidente: "INSTALACION",
      solicitanteNombre: "Gerente Nuevo Local",
      solicitanteCorreo: "gerente@nuevo.com",
      solicitanteTelefono: "987654321",
      nuevaSucursal: {
        nombre: "Local #5",
        comunaId: VALID_COMUNA_ID,
        direccion: {
          calle: "Calle Falsa",
          numero: "123",
          depto: "Oficina 2",
        }
      }
    };

    const mockDireccion = { id: 'd1e2f3a4-b5c6-d7e8-f9a0-b1c2d3e4f5a6' };
    const mockSucursal = { id: 's1u2c3u4-r5s6-a7l8-p9r0-u1e2b3a4c5d6' };
    const mockTicket = { id: 't1i2c3k4-e5t6-n7u8-e9v0-o1b2c3d4e5f6', sucursalId: mockSucursal.id };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: (tx: Prisma.TransactionClient) => Promise<any>) => {
      vi.spyOn(prisma.direccion, 'create').mockResolvedValue(mockDireccion as any);
      vi.spyOn(prisma.sucursal, 'create').mockResolvedValue(mockSucursal as any);
      return await callback(prisma as any);
    });

    vi.spyOn(prisma.ticket, 'count').mockResolvedValue(10);
    vi.spyOn(prisma.ticket, 'create').mockResolvedValue(mockTicket as any);

    const result = await TicketService.createTicket(inputData);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.direccion.create).toHaveBeenCalledTimes(1);
    expect(prisma.sucursal.create).toHaveBeenCalledTimes(1);
    expect(prisma.ticket.create).toHaveBeenCalledTimes(1);
    expect(prisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sucursal: { connect: { id: mockSucursal.id } }
        })
      })
    );
    expect(result.sucursalId).toBe(mockSucursal.id);
  });
});
