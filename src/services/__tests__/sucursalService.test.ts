// src/services/__tests__/sucursalService.test.ts

// Importamos el servicio que vamos a probar
import { SucursalService, SucursalCreateInput, SucursalUpdateInput } from '../sucursalService';
import { prisma } from '../../lib/prisma';
import { Prisma, EstadoSucursal } from '@prisma/client'; // Importar enums y Prisma

// Mockeamos el módulo 'prisma' para controlar el comportamiento de sus métodos.
// Se incluye 'vi' en la importación para que TypeScript reconozca sus tipos.
// Además, importamos 'MockedObject' explícitamente para el tipado.
import { describe, it, expect, beforeEach, vi, type MockedObject } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    sucursal: {
      findMany: vi.fn() as any, // Añadido 'as any' para forzar el tipo de mock
      findUnique: vi.fn() as any,
      create: vi.fn() as any,
      update: vi.fn() as any,
      count: vi.fn() as any,
    },
    direccion: {
      create: vi.fn() as any,
      update: vi.fn() as any,
      delete: vi.fn() as any,
      count: vi.fn() as any,
    },
    ubicacion: {
      count: vi.fn() as any,
    },
    ticket: {
      count: vi.fn() as any,
    },
    empresa: {
      count: vi.fn() as any,
    },
    // Mockeamos $transaction para que simplemente ejecute el callback que recibe
    $transaction: vi.fn((callback: any) => Promise.resolve(callback(prisma as MockedObject<typeof prisma>))) as any, // Usamos MockedObject aquí
    $disconnect: vi.fn() as any,
  },
}));

// Casteamos la instancia mockeada de prisma para un mejor tipado en las pruebas
const mockPrisma = prisma as MockedObject<typeof prisma>;

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
    estado: EstadoSucursal.ACTIVA, // Añadido el estado
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
    it('debe retornar una lista de sucursales activas por defecto ordenadas alfabéticamente', async () => {
      const mockSucursales = [
        { ...mockExistingSucursal, id: 'id-b', nombre: 'Sucursal B', estado: EstadoSucursal.ACTIVA },
        { ...mockExistingSucursal, id: 'id-a', nombre: 'Sucursal A', estado: EstadoSucursal.ACTIVA },
      ];
      (mockPrisma.sucursal.findMany as any).mockResolvedValue(mockSucursales);

      const sucursales = await SucursalService.getSucursales();

      expect(mockPrisma.sucursal.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.sucursal.findMany).toHaveBeenCalledWith({
        where: { estado: EstadoSucursal.ACTIVA },
        include: { empresa: true, direccion: true }, // Las inclusiones deben ser true por defecto en el servicio
        orderBy: { nombre: 'asc' },
      });
      expect(sucursales).toEqual(mockSucursales);
    });

    it('debe retornar sucursales inactivas si se solicita', async () => {
      const mockSucursalesInactivas = [
        { ...mockExistingSucursal, id: 'id-c', nombre: 'Sucursal C Inactiva', estado: EstadoSucursal.INACTIVA },
      ];
      (mockPrisma.sucursal.findMany as any).mockResolvedValue(mockSucursalesInactivas);

      const sucursales = await SucursalService.getSucursales(EstadoSucursal.INACTIVA);

      expect(mockPrisma.sucursal.findMany).toHaveBeenCalledWith({
        where: { estado: EstadoSucursal.INACTIVA },
        include: { empresa: true, direccion: true },
        orderBy: { nombre: 'asc' },
      });
      expect(sucursales).toEqual(mockSucursalesInactivas);
    });

    it('debe manejar errores cuando Prisma falla al obtener sucursales', async () => {
      // **CORRECCIÓN AQUÍ:** El mock lanza el error con el mensaje COMPLETO que el servicio construirá.
      (mockPrisma.sucursal.findMany as any).mockRejectedValue(new Error('DB Error para Sucursales'));
      await expect(SucursalService.getSucursales()).rejects.toThrow('No se pudieron obtener las sucursales. Detalles: DB Error para Sucursales');
    });
  });

  // --- Pruebas para getSucursalById ---
  describe('getSucursalById', () => {
    it('debe retornar una sucursal por su ID con todas las relaciones', async () => {
      const mockSucursalWithAllRelations = {
        ...mockExistingSucursal,
        estado: EstadoSucursal.ACTIVA, // Aseguramos el estado en el mock de retorno
        empresa: { id: mockEmpresaId, nombre: 'Empresa Test' },
        direccion: { ...mockExistingDireccion, comuna: { id: mockComunaId, nombre: 'Comuna Test', provincia: { id: 'provincia-test', nombre: 'Provincia Test', region: { id: 'region-test', nombre: 'Region Test' } } } },
        ubicaciones: [],
        tickets: [],
      };
      (mockPrisma.sucursal.findUnique as any).mockResolvedValue(mockSucursalWithAllRelations);

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
      (mockPrisma.sucursal.findUnique as any).mockResolvedValue(null);
      const sucursal = await SucursalService.getSucursalById('non-existent-id');
      expect(sucursal).toBeNull();
    });

    it('debe manejar errores cuando Prisma falla al obtener sucursal por ID', async () => {
      // **CORRECCIÓN AQUÍ:** El mock lanza el error con el mensaje COMPLETO que el servicio construirá.
      (mockPrisma.sucursal.findUnique as any).mockRejectedValue(new Error('DB Error para Sucursal por ID'));
      await expect(SucursalService.getSucursalById(mockDireccionId)).rejects.toThrow('No se pudo obtener la sucursal. Detalles: DB Error para Sucursal por ID');
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
      (mockPrisma.direccion.create as any).mockResolvedValue(mockExistingDireccion);
      (mockPrisma.sucursal.create as any).mockResolvedValue({
        ...mockExistingSucursal,
        id: 'new-sucursal-id',
        direccionId: mockDireccionId,
        empresaId: mockEmpresaId,
        ...newSucursalData,
        estado: EstadoSucursal.ACTIVA, // Aseguramos que el estado se establece al crear
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
          telefono: newSucursalData.telefono, // Aseguramos que se pasa el teléfono
          email: newSucursalData.email,     // Aseguramos que se pasa el email
          direccion: { connect: { id: mockDireccionId } },
          empresa: { connect: { id: mockEmpresaId } },
          estado: EstadoSucursal.ACTIVA, // Confirmamos que el estado ACTIVA se setea
        }),
      });
      expect(sucursal).toHaveProperty('id', 'new-sucursal-id');
      expect(sucursal).toHaveProperty('nombre', 'Nueva Sucursal');
      expect(sucursal).toHaveProperty('estado', EstadoSucursal.ACTIVA);
    });

    it('debe lanzar un error de validación Zod si los datos son inválidos', async () => {
      // Forzamos que el mock NO resuelva nada para datos inválidos
      (mockPrisma.direccion.create as any).mockImplementation(() => { throw new Error('No debe llamarse'); });
      (mockPrisma.sucursal.create as any).mockImplementation(() => { throw new Error('No debe llamarse'); });
      const invalidData = { ...newSucursalData, nombre: 'a' }; // Nombre muy corto
      await expect(SucursalService.createSucursal(invalidData as any)).rejects.toThrow('Error de validación: El nombre de la sucursal es requerido.');
      expect(mockPrisma.direccion.create).not.toHaveBeenCalled();
      expect(mockPrisma.sucursal.create).not.toHaveBeenCalled();
    });

    it('debe manejar errores de Prisma por dirección duplicada', async () => {
      (mockPrisma.direccion.create as any).mockResolvedValue(mockExistingDireccion); // Direccion se crea
      (mockPrisma.sucursal.create as any).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', meta: { target: ['direccionId'] }, clientVersion: 'test' })); // Usamos array para target

      await expect(SucursalService.createSucursal(newSucursalData)).rejects.toThrow('La dirección ya está asociada a otra sucursal.');
      expect(mockPrisma.direccion.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.sucursal.create).toHaveBeenCalledTimes(1);
    });

    it('debe manejar otros errores de Prisma al crear sucursal', async () => {
      (mockPrisma.direccion.create as any).mockResolvedValue(mockExistingDireccion);
      (mockPrisma.sucursal.create as any).mockRejectedValue(new Error('Other DB Error Generico'));

      await expect(SucursalService.createSucursal(newSucursalData)).rejects.toThrow('Error al crear la sucursal. Detalles: Other DB Error Generico');
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
      (mockPrisma.sucursal.update as any).mockResolvedValue({ ...mockExistingSucursal, ...updateData, estado: EstadoSucursal.ACTIVA }); // Estado
      (mockPrisma.direccion.update as any).mockResolvedValue(mockExistingDireccion); // Mockear la dirección update para que no falle

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
      expect(sucursal).toHaveProperty('estado', EstadoSucursal.ACTIVA);
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
      // Mockear ambas llamadas a update (direccion y sucursal)
      (mockPrisma.direccion.update as any).mockResolvedValue({ ...mockExistingDireccion, ...updateData.direccion });
      (mockPrisma.sucursal.update as any).mockResolvedValue({ ...mockExistingSucursal, ...updateData, estado: EstadoSucursal.ACTIVA });

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
      // La aserción original de nombre no se actualiza ya que la dirección se actualiza por separado
      expect(sucursal).toHaveProperty('estado', EstadoSucursal.ACTIVA);
      // Podemos añadir una aserción para verificar que la dirección en el retorno es la esperada si se incluye
      // En este mock, el `updateSucursal` devuelve `mockExistingSucursal` modificado.
      // Si `updateSucursal` en el servicio solo devuelve la sucursal, no su dirección actualizada,
      // entonces estas aserciones se deben enfocar solo en el resultado de la sucursal.
      // Para esta prueba, verificar si la función de actualización de dirección fue llamada es suficiente.
    });

    it('debe desvincular la empresa si empresaId se envía como null', async () => {
      const updateData: SucursalUpdateInput = {
        id: mockExistingSucursal.id,
        empresaId: null,
      };
      (mockPrisma.sucursal.update as any).mockResolvedValue({ ...mockExistingSucursal, empresaId: null, estado: EstadoSucursal.ACTIVA });

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
      (mockPrisma.sucursal.update as any).mockImplementation(() => { throw new Error('No debe llamarse'); });
      const invalidData = { id: mockExistingSucursal.id, email: 'invalid-email' };
      await expect(SucursalService.updateSucursal(invalidData as any)).rejects.toThrow('Error de validación: Formato de correo electrónico inválido.');
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
      // El mock de Prisma ahora simula que el target del error P2002 es 'direccionId'
      (mockPrisma.direccion.update as any).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', meta: { target: ['direccionId'] }, clientVersion: 'test' }));

      await expect(SucursalService.updateSucursal(updateData)).rejects.toThrow('La dirección ya está asociada a otra sucursal.');
      expect(mockPrisma.sucursal.update).not.toHaveBeenCalled();
    });

    it('debe manejar otros errores de Prisma al actualizar sucursal', async () => {
      const updateData = { id: mockExistingSucursal.id, nombre: 'Fail' };
      (mockPrisma.sucursal.update as any).mockRejectedValue(new Error('Update DB Error Generico'));
      await expect(SucursalService.updateSucursal(updateData)).rejects.toThrow('Error al actualizar la sucursal. Detalles: Update DB Error Generico');
    });
  });

  // --- Pruebas para deactivateSucursal ---
  describe('deactivateSucursal', () => {
    it('debe desactivar una sucursal estableciendo su estado a INACTIVA', async () => {
      const mockDeactivatedSucursal = { ...mockExistingSucursal, estado: EstadoSucursal.INACTIVA };
      (mockPrisma.sucursal.update as any).mockResolvedValue(mockDeactivatedSucursal);

      const sucursal = await SucursalService.deactivateSucursal(mockExistingSucursal.id);

      expect(mockPrisma.sucursal.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.sucursal.update).toHaveBeenCalledWith({
        where: { id: mockExistingSucursal.id },
        data: { estado: EstadoSucursal.INACTIVA },
      });
      expect(sucursal).toEqual(mockDeactivatedSucursal);
    });

    it('debe manejar errores si la sucursal no se encuentra al intentar desactivar', async () => {
      (mockPrisma.sucursal.update as any).mockRejectedValue(new Error('Sucursal not found Generico'));
      await expect(SucursalService.deactivateSucursal('non-existent-id')).rejects.toThrow('Sucursal not found Generico');
    });

    it('debe manejar otros errores de Prisma al desactivar sucursal', async () => {
      (mockPrisma.sucursal.update as any).mockRejectedValue(new Error('DB Deactivation Error Generico'));
      await expect(SucursalService.deactivateSucursal(mockExistingSucursal.id)).rejects.toThrow('DB Deactivation Error Generico');
    });
  });
});
