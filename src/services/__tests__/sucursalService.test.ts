// src/services/__tests__/sucursalService.test.ts

// Importamos el servicio que vamos a probar
import { SucursalService, SucursalCreateInput, SucursalUpdateInput } from '../sucursalService';
import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client'; // Importar enums y Prisma

// Mockeamos el módulo 'prisma' para controlar el comportamiento de sus métodos.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    sucursal: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(), // <-- Agregado para los tests de eliminación
    },
    direccion: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(), // Para verificar si la dirección es usada al eliminar sucursal
    },
    ubicacion: {
      count: vi.fn(), // Para la lógica de eliminación de sucursal
    },
    ticket: {
      count: vi.fn(), // Para la lógica de eliminación de sucursal
    },
    empresa: {
      count: vi.fn(), // Para la lógica de eliminación de sucursal (si la dirección es usada por empresa)
    },
    // Mockeamos $transaction para que simplemente ejecute el callback que recibe    $transaction: vi.fn((callback) => callback(prisma as unknown as vi.Mocked<typeof prisma>)), // Pasamos el mock de tx para funciones anidadas
    $disconnect: vi.fn(),
  },
}));

// Casteamos la instancia mockeada de prisma para un mejor tipado en las pruebas
const mockPrisma = prisma as unknown as vi.Mocked<typeof prisma>;

describe('SucursalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDate = new Date(); // Fecha de mock para createdAt/updatedAt
  const mockEmpresaId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d01'; // UUID válido
  const mockDireccionId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d02'; // UUID válido
  const mockComunaId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d03'; // UUID válido

  const mockExistingSucursal = {
    id: mockDireccionId, // UUID válido
    nombre: 'Sucursal Principal',
    telefono: '1111111',
    email: 'principal@test.com',
    direccionId: mockDireccionId,
    empresaId: mockEmpresaId,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockExistingDireccion = {
    id: mockDireccionId,
    calle: 'Calle Falsa',
    numero: '123',
    depto: null,
    comunaId: mockComunaId,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  // --- Pruebas para getSucursales ---
  describe('getSucursales', () => {
    it('debe retornar una lista de sucursales ordenadas alfabéticamente', async () => {
      const mockSucursales = [
        { ...mockExistingSucursal, id: mockDireccionId, nombre: 'Sucursal B' },
        { ...mockExistingSucursal, id: mockDireccionId, nombre: 'Sucursal A' },
      ];
      (mockPrisma.sucursal.findMany as vi.Mock).mockResolvedValue(mockSucursales);

      const sucursales = await SucursalService.getSucursales();

      expect(mockPrisma.sucursal.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.sucursal.findMany).toHaveBeenCalledWith({
        include: { empresa: false, direccion: false }, // Se pasa false por defecto
        orderBy: { nombre: 'asc' },
      });
      expect(sucursales).toEqual(mockSucursales);
    });

    it('debe incluir las relaciones si se solicita', async () => {
      const mockSucursalWithRelations = {
        ...mockExistingSucursal,
        empresa: { id: mockEmpresaId, nombre: 'Empresa Test' },
        direccion: { id: mockDireccionId, calle: 'Calle Test', numero: '123', comunaId: mockComunaId },
      };
      (mockPrisma.sucursal.findMany as vi.Mock).mockResolvedValue([mockSucursalWithRelations]);

      const sucursales = await SucursalService.getSucursales(true);

      expect(mockPrisma.sucursal.findMany).toHaveBeenCalledWith({
        include: { empresa: true, direccion: true },
        orderBy: { nombre: 'asc' },
      });
      expect(sucursales[0]).toHaveProperty('empresa');
      expect(sucursales[0]).toHaveProperty('direccion');
    });

    it('debe manejar errores cuando Prisma falla al obtener sucursales', async () => {
      (mockPrisma.sucursal.findMany as vi.Mock).mockRejectedValue(new Error('DB Error'));
      await expect(SucursalService.getSucursales()).rejects.toThrow('No se pudieron obtener las sucursales.');
    });
  });

  // --- Pruebas para getSucursalById ---
  describe('getSucursalById', () => {
    it('debe retornar una sucursal por su ID con todas las relaciones', async () => {
      const mockSucursalWithAllRelations = {
        ...mockExistingSucursal,
        empresa: { id: mockEmpresaId, nombre: 'Empresa Test' },
        direccion: { ...mockExistingDireccion, comuna: { id: mockComunaId, nombre: 'Comuna Test', provincia: { id: 'provincia-test', nombre: 'Provincia Test', region: { id: 'region-test', nombre: 'Region Test' } } } },
        ubicaciones: [],
        tickets: [],
      };
      (mockPrisma.sucursal.findUnique as vi.Mock).mockResolvedValue(mockSucursalWithAllRelations);

      const sucursal = await SucursalService.getSucursalById(mockDireccionId);

      expect(mockPrisma.sucursal.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.sucursal.findUnique).toHaveBeenCalledWith({
        where: { id: mockDireccionId },
        include: {
          empresa: true,
          direccion: {
            include: {
              comuna: {
                include: {
                  provincia: {
                    include: {
                      region: true,
                    },
                  },
                },
              },
            },
          },
          ubicaciones: true,
          tickets: true,
        },
      });
      expect(sucursal).toEqual(mockSucursalWithAllRelations);
    });

    it('debe retornar null si la sucursal no se encuentra', async () => {
      (mockPrisma.sucursal.findUnique as vi.Mock).mockResolvedValue(null);
      const sucursal = await SucursalService.getSucursalById('non-existent-id');
      expect(sucursal).toBeNull();
    });

    it('debe manejar errores cuando Prisma falla al obtener sucursal por ID', async () => {
      (mockPrisma.sucursal.findUnique as vi.Mock).mockRejectedValue(new Error('DB Error'));
      await expect(SucursalService.getSucursalById(mockDireccionId)).rejects.toThrow('No se pudo obtener la sucursal.');
    });
  });

  // --- Pruebas para createSucursal ---
  describe('createSucursal', () => {
    const newSucursalData: SucursalCreateInput = {
      nombre: 'Nueva Sucursal',
      telefono: '2222222',
      email: 'nueva@sucursal.com',
      empresaId: mockEmpresaId,
      direccion: {
        calle: 'Av. Siempre Viva',
        numero: '742',
        comunaId: mockComunaId,
      },
    };

    it('debe crear una nueva sucursal con su dirección y retornar el objeto creado', async () => {
      (mockPrisma.direccion.create as vi.Mock).mockResolvedValue(mockExistingDireccion);
      (mockPrisma.sucursal.create as vi.Mock).mockResolvedValue({
        ...mockExistingSucursal,
        id: 'new-sucursal-id',
        direccionId: mockDireccionId,
        empresaId: mockEmpresaId,
        ...newSucursalData,
      });

      const sucursal = await SucursalService.createSucursal(newSucursalData);

      expect(mockPrisma.direccion.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.direccion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          calle: newSucursalData.direccion.calle,
          numero: newSucursalData.direccion.numero,
          comuna: { connect: { id: newSucursalData.direccion.comunaId } },
        }),
      });
      expect(mockPrisma.sucursal.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.sucursal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nombre: newSucursalData.nombre,
          direccion: { connect: { id: mockDireccionId } },
          empresa: { connect: { id: mockEmpresaId } },
        }),
      });
      expect(sucursal).toHaveProperty('id', 'new-sucursal-id');
      expect(sucursal).toHaveProperty('nombre', 'Nueva Sucursal');
    });

    it('debe lanzar un error de validación Zod si los datos son inválidos', async () => {
      // Forzamos que el mock NO resuelva nada para datos inválidos
      (mockPrisma.direccion.create as vi.Mock).mockImplementation(() => { throw new Error('No debe llamarse'); });
      (mockPrisma.sucursal.create as vi.Mock).mockImplementation(() => { throw new Error('No debe llamarse'); });
      const invalidData = { ...newSucursalData, nombre: 'a' }; // Nombre muy corto
      await expect(SucursalService.createSucursal(invalidData as any)).rejects.toThrow(/Error de validación/i);
      expect(mockPrisma.direccion.create).not.toHaveBeenCalled();
      expect(mockPrisma.sucursal.create).not.toHaveBeenCalled();
    });

    it('debe manejar errores de Prisma por dirección duplicada', async () => {
      (mockPrisma.direccion.create as vi.Mock).mockResolvedValue(mockExistingDireccion); // Direccion se crea
      (mockPrisma.sucursal.create as vi.Mock).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', meta: { target: 'sucursales_direccionId_key' }, clientVersion: 'test' }));

      await expect(SucursalService.createSucursal(newSucursalData)).rejects.toThrow('La dirección ya está asociada a otra sucursal.');
      expect(mockPrisma.direccion.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.sucursal.create).toHaveBeenCalledTimes(1);
    });

    it('debe manejar otros errores de Prisma al crear sucursal', async () => {
      (mockPrisma.direccion.create as jest.Mock).mockResolvedValue(mockExistingDireccion);
      (mockPrisma.sucursal.create as vi.Mock).mockRejectedValue(new Error('Other DB Error'));

      await expect(SucursalService.createSucursal(newSucursalData)).rejects.toThrow('Error al crear la sucursal. Detalles: Other DB Error');
    });
  });

  // --- Pruebas para updateSucursal ---
  describe('updateSucursal', () => {
    it('debe actualizar los campos de la sucursal y retornar el objeto actualizado', async () => {
      const updateData: SucursalUpdateInput = {
        id: mockExistingSucursal.id,
        nombre: 'Sucursal Actualizada',
        email: 'updated@test.com',
      };
      (mockPrisma.sucursal.update as vi.Mock).mockResolvedValue({ ...mockExistingSucursal, ...updateData });

      const sucursal = await SucursalService.updateSucursal(updateData);

      expect(mockPrisma.sucursal.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.sucursal.update).toHaveBeenCalledWith({
        where: { id: updateData.id },
        data: expect.objectContaining({
          nombre: 'Sucursal Actualizada',
          email: 'updated@test.com',
        }),
      });
      expect(sucursal).toHaveProperty('nombre', 'Sucursal Actualizada');
    });

    it('debe actualizar la dirección si se proporciona con ID', async () => {
      const updateData: SucursalUpdateInput = {
        id: mockDireccionId,
        direccion: {
          id: mockDireccionId,
          calle: 'Nueva Calle',
          numero: '456',
          comunaId: mockComunaId,
        },
      };
      (mockPrisma.direccion.update as vi.Mock).mockResolvedValue({ ...mockExistingDireccion, ...updateData.direccion });
      (mockPrisma.sucursal.update as vi.Mock).mockResolvedValue({ ...mockExistingSucursal, ...updateData });

      const sucursal = await SucursalService.updateSucursal(updateData);

      expect(mockPrisma.direccion.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.direccion.update).toHaveBeenCalledWith({
        where: { id: mockDireccionId },
        data: expect.objectContaining({
          calle: 'Nueva Calle',
          numero: '456',
          comuna: { connect: { id: mockComunaId } },
        }),
      });
      expect(mockPrisma.sucursal.update).toHaveBeenCalledTimes(1);
      expect(sucursal).toHaveProperty('nombre', mockExistingSucursal.nombre); // Solo se actualizó la dirección, no el nombre
    });

    it('debe desvincular la empresa si empresaId se envía como null', async () => {
      const updateData: SucursalUpdateInput = {
        id: mockExistingSucursal.id,
        empresaId: null,
      };
      (mockPrisma.sucursal.update as vi.Mock).mockResolvedValue({ ...mockExistingSucursal, empresaId: null });

      const sucursal = await SucursalService.updateSucursal(updateData);

      expect(mockPrisma.sucursal.update).toHaveBeenCalledWith({
        where: { id: updateData.id },
        data: expect.objectContaining({
          empresa: { disconnect: true },
        }),
      });
      expect(sucursal).toHaveProperty('empresaId', null);
    });

    it('debe lanzar un error de validación Zod si los datos son inválidos', async () => {
      (mockPrisma.sucursal.update as vi.Mock).mockImplementation(() => { throw new Error('No debe llamarse'); });
      const invalidData = { ...mockExistingSucursal, id: mockExistingSucursal.id, email: 'invalid-email' };
      await expect(SucursalService.updateSucursal(invalidData as any)).rejects.toThrow(/Error de validación/i);
      expect(mockPrisma.sucursal.update).not.toHaveBeenCalled();
    });

    it('debe manejar errores de Prisma por dirección duplicada al actualizar', async () => {
      const updateData: SucursalUpdateInput = {
        id: mockDireccionId,
        direccion: {
          id: mockDireccionId,
          calle: 'Otra Calle',
          numero: '789',
          comunaId: mockComunaId,
        },
      };
      (mockPrisma.direccion.update as vi.Mock).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', meta: { target: 'sucursales_direccionId_key' }, clientVersion: 'test' }));

      await expect(SucursalService.updateSucursal(updateData)).rejects.toThrow('La dirección ya está asociada a otra sucursal.');
      expect(mockPrisma.sucursal.update).not.toHaveBeenCalled();
    });

    it('debe manejar otros errores de Prisma al actualizar sucursal', async () => {
      const updateData = { id: mockExistingSucursal.id, nombre: 'Fail' };
      (mockPrisma.sucursal.update as vi.Mock).mockRejectedValue(new Error('Update DB Error'));
      await expect(SucursalService.updateSucursal(updateData)).rejects.toThrow('Error al actualizar la sucursal. Detalles: Update DB Error');
    });
  });

  // --- Pruebas para deleteSucursal ---
  describe('deleteSucursal', () => {
    it('debe eliminar una sucursal si no tiene ubicaciones ni tickets asociados', async () => {
      (mockPrisma.ubicacion.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.ticket.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.sucursal.findUnique as vi.Mock).mockResolvedValue({ direccionId: mockDireccionId });
      (mockPrisma.sucursal.delete as vi.Mock).mockResolvedValue({});
      // Simula que después de eliminar la sucursal, ninguna otra sucursal usa la dirección
      (mockPrisma.sucursal.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.empresa.count as vi.Mock).mockResolvedValue(0);

      const result = await SucursalService.deleteSucursal(mockDireccionId);

      expect(mockPrisma.ubicacion.count).toHaveBeenCalledWith({ where: { sucursalId: mockDireccionId } });
      expect(mockPrisma.ticket.count).toHaveBeenCalledWith({ where: { sucursalId: mockDireccionId } });
      expect(mockPrisma.sucursal.delete).toHaveBeenCalledWith({ where: { id: mockDireccionId } });
      expect(mockPrisma.direccion.delete).toHaveBeenCalledWith({ where: { id: mockDireccionId } });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Sucursal eliminada exitosamente.');
    });

    it('NO debe eliminar la sucursal si tiene ubicaciones asociadas', async () => {
    (mockPrisma.ubicacion.count as vi.Mock).mockResolvedValue(1); // Simula 1 ubicación
    await expect(SucursalService.deleteSucursal(mockDireccionId)).resolves.toEqual(
        expect.objectContaining({
        success: false,
        message: expect.stringContaining('No se puede eliminar la sucursal porque tiene ubicaciones asociadas')
        })
    );
    expect(mockPrisma.sucursal.delete).not.toHaveBeenCalled();
    });

    it('NO debe eliminar la sucursal si tiene tickets asociados', async () => {
    (mockPrisma.ubicacion.count as vi.Mock).mockResolvedValue(0);
    (mockPrisma.ticket.count as vi.Mock).mockResolvedValue(1); // Simula 1 ticket
    await expect(SucursalService.deleteSucursal(mockDireccionId)).resolves.toEqual(
        expect.objectContaining({
        success: false,
        message: expect.stringContaining('No se puede eliminar la sucursal porque tiene tickets asociados')
        })
    );
    expect(mockPrisma.sucursal.delete).not.toHaveBeenCalled();
    });

    it('debe manejar errores de Prisma al eliminar sucursal', async () => {
    (mockPrisma.ubicacion.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.ticket.count as vi.Mock).mockResolvedValue(0);
    (mockPrisma.sucursal.findUnique as vi.Mock).mockResolvedValue({ direccionId: mockDireccionId });
    (mockPrisma.sucursal.delete as vi.Mock).mockRejectedValue(new Error('Delete DB Error'));

    await expect(SucursalService.deleteSucursal(mockDireccionId)).resolves.toEqual(
        expect.objectContaining({
        success: false,
        message: expect.stringContaining('Delete DB Error')
        })
    );
    });

    it('no debe eliminar la dirección si es usada por otra sucursal', async () => {
    (mockPrisma.ubicacion.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.ticket.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.sucursal.findUnique as jest.Mock).mockResolvedValue({ direccionId: mockDireccionId });
    (mockPrisma.sucursal.delete as vi.Mock).mockResolvedValue({});
    // Simula que después de eliminar la sucursal, otra sucursal sigue usando la dirección
    (mockPrisma.sucursal.count as vi.Mock).mockResolvedValue(1);
    (mockPrisma.empresa.count as vi.Mock).mockResolvedValue(0);

    const result = await SucursalService.deleteSucursal(mockDireccionId);

    expect(mockPrisma.sucursal.delete).toHaveBeenCalledTimes(1);
    expect(mockPrisma.direccion.delete).not.toHaveBeenCalled(); // La dirección NO debe ser eliminada
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/Sucursal eliminada exitosamente/);
    });

    it('no debe eliminar la dirección si es usada como principal por una empresa', async () => {
    (mockPrisma.ubicacion.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.ticket.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.sucursal.findUnique as jest.Mock).mockResolvedValue({ direccionId: mockDireccionId });
    (mockPrisma.sucursal.delete as jest.Mock).mockResolvedValue({});
    (mockPrisma.sucursal.count as jest.Mock).mockResolvedValue(0);
    // Simula que una empresa sigue usando la dirección como principal
    (mockPrisma.empresa.count as vi.Mock).mockResolvedValue(1);

    const result = await SucursalService.deleteSucursal(mockDireccionId);

    expect(mockPrisma.sucursal.delete).toHaveBeenCalledTimes(1);
    expect(mockPrisma.direccion.delete).not.toHaveBeenCalled(); // La dirección NO debe ser eliminada
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/Sucursal eliminada exitosamente/);
    });
  });
});
