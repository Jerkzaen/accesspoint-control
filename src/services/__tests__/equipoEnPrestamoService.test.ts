// src/services/__tests__/equipoEnPrestamoService.test.ts

// Importamos el servicio que vamos a probar
import { EquipoEnPrestamoService, EquipoEnPrestamoCreateInput, EquipoEnPrestamoUpdateInput } from '../equipoEnPrestamoService';
import { prisma } from '../../lib/prisma';
import { Prisma, EstadoPrestamoEquipo, EstadoEquipoInventario, TipoEquipoInventario, PrioridadTicket, EstadoTicket, RoleUsuario } from '@prisma/client'; // Importar enums y Prisma


// Mockeamos el módulo 'prisma' para controlar el comportamiento de sus métodos.
import { describe, it, expect, beforeEach, vi, type MockedObject, type Mock } from 'vitest';
import { ZodError } from 'zod';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    equipoEnPrestamo: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    // Métodos de otras tablas que EquipoEnPrestamoService usa
    equipoInventario: {
      update: vi.fn(), // Para actualizar el estado del equipo
    },
    // Mockeamos $transaction para que simplemente ejecute el callback que recibe
    $transaction: vi.fn((callback) => callback(prisma as unknown as MockedObject<typeof prisma>)), // Pasamos el mock de tx para funciones anidadas
    $disconnect: vi.fn(),
  },
}));

// Casteamos la instancia mockeada de prisma para un mejor tipado en las pruebas
const mockPrisma = prisma as unknown as MockedObject<typeof prisma>;

describe('EquipoEnPrestamoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDate = new Date();
  const mockPrestamoId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d20'; // UUID válido para préstamo
  const mockEquipoId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d08'; // UUID válido para equipo
  const mockContactoId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d10'; // UUID válido para contacto
  const mockTicketId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d30'; // UUID válido para ticket
  const mockUsuarioEntregadoId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d40'; // UUID válido para usuario
  const mockUsuarioRecibidoId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d41'; // UUID válido para usuario

  const mockExistingPrestamo = {
    id: mockPrestamoId,
    equipoId: mockEquipoId,
    prestadoAContactoId: mockContactoId,
    personaResponsableEnSitio: 'Responsable Préstamo',
    fechaPrestamo: mockDate,
    fechaDevolucionEstimada: new Date(mockDate.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 días
    fechaDevolucionReal: null,
    estadoPrestamo: EstadoPrestamoEquipo.PRESTADO,
    ticketId: mockTicketId,
    notasPrestamo: 'Notas iniciales',
    notasDevolucion: null,
    entregadoPorUsuarioId: mockUsuarioEntregadoId,
    recibidoPorUsuarioId: null,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockEquipoInventario = {
    id: mockEquipoId,
    nombreDescriptivo: 'Laptop XYZ',
    identificadorUnico: 'ABC-123',
    tipoEquipo: TipoEquipoInventario.NOTEBOOK,
    marca: 'Marca', modelo: 'Modelo', descripcionAdicional: null,
    estadoEquipo: EstadoEquipoInventario.DISPONIBLE,
    fechaAdquisicion: mockDate, proveedor: 'Proveedor', ubicacionActualId: null, notasGenerales: null,
    panelVtsSerie: null, pedalVtsSerie: null, biarticTipoDispositivo: null, empresaId: null,
    createdAt: mockDate, updatedAt: mockDate
  };

  const mockContactoEmpresa = {
    id: mockContactoId,
    nombreCompleto: 'Contacto Test', email: 'contacto@test.com', telefono: '123456789',
    cargo: null, empresaId: null, ubicacionId: null, createdAt: mockDate, updatedAt: mockDate
  };

  const mockTicket = {
    id: mockTicketId,
    numeroCaso: 1, titulo: 'Problema con equipo', descripcionDetallada: null,
    tipoIncidente: 'Hardware', prioridad: PrioridadTicket.MEDIA, estado: EstadoTicket.ABIERTO,
    solicitanteNombre: 'Solicitante', solicitanteTelefono: null, solicitanteCorreo: null,
    contactoId: null, empresaId: null, sucursalId: null, creadoPorUsuarioId: 'user1', tecnicoAsignadoId: null,
    fechaCreacion: mockDate, fechaSolucionEstimada: null, fechaSolucionReal: null, equipoAfectado: null,
    updatedAt: mockDate
  };

  const mockUserEntregado = { id: mockUsuarioEntregadoId, name: 'User Entregado', email: 'entregado@test.com', emailVerified: null, image: null, rol: RoleUsuario.TECNICO, createdAt: mockDate, updatedAt: mockDate };
  const mockUserRecibido = { id: mockUsuarioRecibidoId, name: 'User Recibido', email: 'recibido@test.com', emailVerified: null, image: null, rol: RoleUsuario.TECNICO, createdAt: mockDate, updatedAt: mockDate };


  // --- Pruebas para getEquiposEnPrestamo ---
  describe('getEquiposEnPrestamo', () => {
    it('debe retornar una lista de registros de préstamo ordenados alfabéticamente', async () => {
      const mockPrestamos = [
        { ...mockExistingPrestamo, id: 'p2', fechaPrestamo: new Date(mockDate.getTime() - 1000) },
        { ...mockExistingPrestamo, id: 'p1', fechaPrestamo: new Date(mockDate.getTime() - 2000) },
      ];
      (mockPrisma.equipoEnPrestamo.findMany as Mock).mockResolvedValue(mockPrestamos);

      const prestamos = await EquipoEnPrestamoService.getEquiposEnPrestamo();

      expect(mockPrisma.equipoEnPrestamo.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.equipoEnPrestamo.findMany).toHaveBeenCalledWith({
        include: undefined, // Se pasa undefined por defecto
        orderBy: { fechaPrestamo: 'desc' },
      });
      expect(prestamos).toEqual(mockPrestamos);
    });

    it('debe incluir las relaciones si se solicita', async () => {
      const mockPrestamoWithRelations = {
        ...mockExistingPrestamo,
        equipo: mockEquipoInventario,
        prestadoAContacto: mockContactoEmpresa,
        ticketAsociado: mockTicket,
        entregadoPorUsuario: mockUserEntregado,
        recibidoPorUsuario: mockUserRecibido,
      };
      (mockPrisma.equipoEnPrestamo.findMany as Mock).mockResolvedValue([mockPrestamoWithRelations]);

      const prestamos = await EquipoEnPrestamoService.getEquiposEnPrestamo(true);

      expect(mockPrisma.equipoEnPrestamo.findMany).toHaveBeenCalledWith({
        include: {
          equipo: true,
          prestadoAContacto: true,
          ticketAsociado: true,
          entregadoPorUsuario: true,
          recibidoPorUsuario: true,
        },
        orderBy: { fechaPrestamo: 'desc' },
      });
      expect(prestamos[0]).toHaveProperty('equipo');
      expect(prestamos[0]).toHaveProperty('prestadoAContacto');
    });

    it('debe manejar errores cuando Prisma falla al obtener préstamos', async () => {
      (mockPrisma.equipoEnPrestamo.findMany as Mock).mockRejectedValue(new Error('DB Error'));
      await expect(EquipoEnPrestamoService.getEquiposEnPrestamo()).rejects.toThrow('No se pudieron obtener los equipos en préstamo.');
    });
  });

  // --- Pruebas para getEquipoEnPrestamoById ---
  describe('getEquipoEnPrestamoById', () => {
    it('debe retornar un registro de préstamo por su ID con todas las relaciones', async () => {
      const mockPrestamoWithAllRelations = {
        ...mockExistingPrestamo,
        equipo: mockEquipoInventario,
        prestadoAContacto: mockContactoEmpresa,
        ticketAsociado: mockTicket,
        entregadoPorUsuario: mockUserEntregado,
        recibidoPorUsuario: mockUserRecibido,
      };
      (mockPrisma.equipoEnPrestamo.findUnique as Mock).mockResolvedValue(mockPrestamoWithAllRelations);

      const prestamo = await EquipoEnPrestamoService.getEquipoEnPrestamoById(mockPrestamoId);

      expect(mockPrisma.equipoEnPrestamo.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.equipoEnPrestamo.findUnique).toHaveBeenCalledWith({
        where: { id: mockPrestamoId },
        include: {
          equipo: true,
          prestadoAContacto: true,
          ticketAsociado: true,
          entregadoPorUsuario: true,
          recibidoPorUsuario: true,
        },
      });
      expect(prestamo).toEqual(mockPrestamoWithAllRelations);
    });

    it('debe retornar null si el registro de préstamo no se encuentra', async () => {
      (mockPrisma.equipoEnPrestamo.findUnique as Mock).mockResolvedValue(null);
      const prestamo = await EquipoEnPrestamoService.getEquipoEnPrestamoById('non-existent-id');
      expect(prestamo).toBeNull();
    });

    it('debe manejar errores cuando Prisma falla al obtener préstamo por ID', async () => {
      (mockPrisma.equipoEnPrestamo.findUnique as Mock).mockRejectedValue(new Error('DB Error'));
      await expect(EquipoEnPrestamoService.getEquipoEnPrestamoById(mockPrestamoId)).rejects.toThrow('No se pudo obtener el registro de préstamo.');
    });
  });

  // --- Pruebas para createEquipoEnPrestamo ---
  describe('createEquipoEnPrestamo', () => {
    const newPrestamoData: EquipoEnPrestamoCreateInput = {
      equipoId: mockEquipoId,
      prestadoAContactoId: mockContactoId,
      personaResponsableEnSitio: 'Nuevo Responsable',
      fechaDevolucionEstimada: new Date(),
      estadoPrestamo: EstadoPrestamoEquipo.PRESTADO,
      notasPrestamo: 'Notas del nuevo préstamo',
      entregadoPorUsuarioId: mockUsuarioEntregadoId,
      ticketId: mockTicketId,
    };

    it('debe crear un nuevo registro de préstamo y actualizar el estado del equipo', async () => {
      (mockPrisma.equipoEnPrestamo.create as Mock).mockResolvedValue({
        id: 'new-prestamo-id',
        ...newPrestamoData,
        fechaPrestamo: new Date(), // Simula la fecha por defecto
        estadoPrestamo: EstadoPrestamoEquipo.PRESTADO,
        createdAt: new Date(), updatedAt: new Date(),
      });
      (mockPrisma.equipoInventario.update as Mock).mockResolvedValue({}); // Mock para la actualización del equipo

      const prestamo = await EquipoEnPrestamoService.createEquipoEnPrestamo(newPrestamoData);

      expect(mockPrisma.equipoEnPrestamo.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.equipoEnPrestamo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            equipo: { connect: { id: newPrestamoData.equipoId } },
            prestadoAContacto: { connect: { id: newPrestamoData.prestadoAContactoId } },
            personaResponsableEnSitio: newPrestamoData.personaResponsableEnSitio,
            ticketAsociado: { connect: { id: newPrestamoData.ticketId } },
            entregadoPorUsuario: { connect: { id: newPrestamoData.entregadoPorUsuarioId } },
            estadoPrestamo: EstadoPrestamoEquipo.PRESTADO,
          }),
        })
      );
      expect(mockPrisma.equipoInventario.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.equipoInventario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: newPrestamoData.equipoId },
          data: { estadoEquipo: EstadoEquipoInventario.PRESTADO },
        })
      );
      expect(prestamo).toHaveProperty('id', 'new-prestamo-id');
    });

    it('debe lanzar un error de validación Zod si los datos son inválidos', async () => {
      const invalidData = { ...newPrestamoData, personaResponsableEnSitio: 'a' }; // Nombre muy corto
      await expect(EquipoEnPrestamoService.createEquipoEnPrestamo(invalidData as any)).rejects.toThrow(/Error de validación al crear préstamo/);
      expect(mockPrisma.equipoEnPrestamo.create).not.toHaveBeenCalled();
      expect(mockPrisma.equipoInventario.update).not.toHaveBeenCalled();
    });

    it('debe manejar otros errores de Prisma al crear préstamo', async () => {
      (mockPrisma.equipoEnPrestamo.create as Mock).mockRejectedValue(new Error('Other DB Error'));
      await expect(EquipoEnPrestamoService.createEquipoEnPrestamo(newPrestamoData)).rejects.toThrow('Error al crear el registro de préstamo. Detalles: Other DB Error');
      expect(mockPrisma.equipoInventario.update).not.toHaveBeenCalled();
    });
  });

  // --- Pruebas para updateEquipoEnPrestamo ---
  describe('updateEquipoEnPrestamo', () => {
    it('debe actualizar los campos del registro de préstamo y retornar el objeto actualizado', async () => {
      const updateData: EquipoEnPrestamoUpdateInput = {
        personaResponsableEnSitio: 'Responsable Actualizado',
        notasDevolucion: 'Equipo en perfecto estado',
      };
      // Mock para findUnique que devuelve los datos del préstamo existente
      (mockPrisma.equipoEnPrestamo.findUnique as Mock).mockResolvedValue({ id: mockPrestamoId, equipoId: mockEquipoId, estadoPrestamo: EstadoPrestamoEquipo.PRESTADO });
      (mockPrisma.equipoEnPrestamo.update as Mock).mockResolvedValue({ ...mockExistingPrestamo, ...updateData });

      const prestamo = await EquipoEnPrestamoService.updateEquipoEnPrestamo(mockPrestamoId, updateData);

      expect(mockPrisma.equipoEnPrestamo.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.equipoEnPrestamo.update).toHaveBeenCalledWith({
        where: { id: mockPrestamoId },
        data: expect.objectContaining({
          personaResponsableEnSitio: 'Responsable Actualizado',
          notasDevolucion: 'Equipo en perfecto estado',
        }),
      });
      expect(prestamo).toHaveProperty('personaResponsableEnSitio', 'Responsable Actualizado');
    });

    it('debe actualizar el estado del equipo a DISPONIBLE si se registra la devolución', async () => {
      const updateData: EquipoEnPrestamoUpdateInput = {
        fechaDevolucionReal: new Date(),
        estadoPrestamo: EstadoPrestamoEquipo.DEVUELTO,
      };
      // Mock para findUnique que devuelve el equipoId antes de la actualización
      (mockPrisma.equipoEnPrestamo.findUnique as Mock).mockResolvedValue({ id: mockPrestamoId, equipoId: mockEquipoId, estadoPrestamo: EstadoPrestamoEquipo.PRESTADO });
      (mockPrisma.equipoEnPrestamo.update as Mock).mockResolvedValue({ ...mockExistingPrestamo, ...updateData });
      (mockPrisma.equipoInventario.update as Mock).mockResolvedValue({}); // Mock para la actualización del equipo

      const prestamo = await EquipoEnPrestamoService.updateEquipoEnPrestamo(mockPrestamoId, updateData);

      expect(mockPrisma.equipoEnPrestamo.findUnique).toHaveBeenCalledWith({ where: { id: mockPrestamoId }, select: { equipoId: true, estadoPrestamo: true } });
      expect(mockPrisma.equipoInventario.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.equipoInventario.update).toHaveBeenCalledWith({
        where: { id: mockEquipoId },
        data: { estadoEquipo: EstadoEquipoInventario.DISPONIBLE },
      });
      expect(prestamo).toHaveProperty('fechaDevolucionReal');
      expect(prestamo).toHaveProperty('estadoPrestamo', EstadoPrestamoEquipo.DEVUELTO);
    });
    
    it('debe desvincular el ticket asociado si ticketId se envía como null', async () => {
      const updateData: EquipoEnPrestamoUpdateInput = {
        ticketId: null,
      };
      (mockPrisma.equipoEnPrestamo.update as Mock).mockResolvedValue({ ...mockExistingPrestamo, ticketId: null });

      const prestamo = await EquipoEnPrestamoService.updateEquipoEnPrestamo(mockPrestamoId, updateData);

      expect(mockPrisma.equipoEnPrestamo.update).toHaveBeenCalledWith({
        where: { id: mockPrestamoId },
        data: expect.objectContaining({
          ticketAsociado: { disconnect: true },
        }),
      });
      expect(prestamo).toHaveProperty('ticketId', null);
    });

    it('debe lanzar un error de validación Zod si los datos son inválidos', async () => {
      const invalidData = { personaResponsableEnSitio: 'a' }; // Nombre muy corto
      await expect(EquipoEnPrestamoService.updateEquipoEnPrestamo(mockPrestamoId, invalidData as any)).rejects.toThrow(/Error de validación al actualizar préstamo/);
      expect(mockPrisma.equipoEnPrestamo.update).not.toHaveBeenCalled();
    });

    it('debe manejar otros errores de Prisma al actualizar préstamo', async () => {
      const updateData = { notasDevolucion: 'Fail' };
      // Mock para findUnique que devuelve los datos del préstamo existente
      (mockPrisma.equipoEnPrestamo.findUnique as Mock).mockResolvedValue({ id: mockPrestamoId, equipoId: mockEquipoId, estadoPrestamo: EstadoPrestamoEquipo.PRESTADO });
      (mockPrisma.equipoEnPrestamo.update as Mock).mockRejectedValue(new Error('Update DB Error'));
      await expect(EquipoEnPrestamoService.updateEquipoEnPrestamo(mockPrestamoId, updateData)).rejects.toThrow('No se pudo actualizar el registro de préstamo. Detalles: Update DB Error');
    });
  });

  // --- Pruebas para deleteEquipoEnPrestamo ---
  describe('deleteEquipoEnPrestamo', () => {
    it('debe eliminar un registro de préstamo', async () => {
      (mockPrisma.equipoEnPrestamo.delete as Mock).mockResolvedValue({});

      await expect(EquipoEnPrestamoService.deleteEquipoEnPrestamo(mockPrestamoId)).resolves.toBeUndefined();
      expect(mockPrisma.equipoEnPrestamo.delete).toHaveBeenCalledTimes(1);
      expect(mockPrisma.equipoEnPrestamo.delete).toHaveBeenCalledWith({ where: { id: mockPrestamoId } });
    });

    it('debe manejar errores de Prisma al eliminar préstamo', async () => {
      (mockPrisma.equipoEnPrestamo.delete as Mock).mockRejectedValue(new Error('Delete DB Error'));
      await expect(EquipoEnPrestamoService.deleteEquipoEnPrestamo(mockPrestamoId)).rejects.toThrow('Error al eliminar el registro de préstamo. Detalles: Delete DB Error');
    });
  });
});
