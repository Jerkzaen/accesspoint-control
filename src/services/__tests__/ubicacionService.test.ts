// src/services/__tests__/ubicacionService.test.ts

    // Importamos el servicio que vamos a probar
import { UbicacionService, UbicacionCreateInput, UbicacionUpdateInput } from '../ubicacionService';
import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client'; // Para tipos de errores de Prisma


    // Mockeamos el módulo 'prisma' para controlar el comportamiento de sus métodos.
    import { describe, it, expect, beforeEach, vi, type MockedObject, type Mock } from 'vitest';
    import { ZodError } from 'zod';

vi.mock('../../lib/prisma', () => ({
      prisma: {
        ubicacion: {
          findMany: vi.fn(),
          findUnique: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        },
        contactoEmpresa: {
          count: vi.fn(), // Para la lógica de eliminación de Ubicacion
        },
        equipoInventario: {
          count: vi.fn(), // Para la lógica de eliminación de Ubicacion
        },
        // Mockeamos $transaction para que simplemente ejecute el callback que recibe
        $transaction: vi.fn((callback) => callback(mockPrisma as unknown as MockedObject<typeof prisma>)), // Pasamos el mock de tx para funciones anidadas
        $disconnect: vi.fn(),
      },
    }));

    // Casteamos la instancia mockeada de prisma para un mejor tipado en las pruebas
    const mockPrisma = prisma as unknown as MockedObject<typeof prisma>;

    describe('UbicacionService', () => {
      beforeEach(() => {
        vi.clearAllMocks();
      });

      const mockDate = new Date();
      const mockSucursalId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d05'; // UUID válido
      const mockUbicacionId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d06'; // UUID válido para ubicación
      const mockContactoId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d07'; // UUID válido
      const mockEquipoId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d08'; // UUID válido

      const mockExistingUbicacion = {
        id: mockUbicacionId,
        nombreReferencial: 'Piso 3',
        sucursalId: mockSucursalId,
        notas: 'Ubicacion de oficinas',
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      // --- Pruebas para getUbicaciones ---
      describe('getUbicaciones', () => {
        it('debe retornar una lista de ubicaciones ordenadas alfabéticamente', async () => {
          const mockUbicaciones = [
            { ...mockExistingUbicacion, id: 'u2', nombreReferencial: 'Pasillo B' },
            { ...mockExistingUbicacion, id: 'u1', nombreReferencial: 'Oficina A' },
          ];
          (mockPrisma.ubicacion.findMany as Mock).mockResolvedValue(mockUbicaciones);

          const ubicaciones = await UbicacionService.getUbicaciones();

          expect(mockPrisma.ubicacion.findMany).toHaveBeenCalledTimes(1);
          expect(mockPrisma.ubicacion.findMany).toHaveBeenCalledWith({
            include: undefined, // Se pasa undefined por defecto
            orderBy: { nombreReferencial: 'asc' },
          });
          expect(ubicaciones).toEqual(mockUbicaciones);
        });

        it('debe incluir las relaciones si se solicita', async () => {
          const mockUbicacionWithRelations = {
            ...mockExistingUbicacion,
            sucursal: { id: mockSucursalId, nombre: 'Sucursal Central' },
            contactos: [{ id: mockContactoId, nombreCompleto: 'Contacto Test' }],
            equiposInventario: [{ id: mockEquipoId, nombreDescriptivo: 'Equipo Test' }],
          };
          (mockPrisma.ubicacion.findMany as Mock).mockResolvedValue([mockUbicacionWithRelations]);

          const ubicaciones = await UbicacionService.getUbicaciones(true);

          expect(mockPrisma.ubicacion.findMany).toHaveBeenCalledWith({
            include: { sucursal: true, contactos: true, equiposInventario: true },
            orderBy: { nombreReferencial: 'asc' },
          });
          expect(ubicaciones[0]).toHaveProperty('sucursal');
          expect(ubicaciones[0]).toHaveProperty('contactos');
          expect(ubicaciones[0]).toHaveProperty('equiposInventario');
        });

        it('debe manejar errores cuando Prisma falla al obtener ubicaciones', async () => {
          (mockPrisma.ubicacion.findMany as Mock).mockRejectedValue(new Error('DB Error'));
          await expect(UbicacionService.getUbicaciones()).rejects.toThrow('No se pudieron obtener las ubicaciones.');
        });
      });

      // --- Pruebas para getUbicacionById ---
      describe('getUbicacionById', () => {
        it('debe retornar una ubicación por su ID con todas las relaciones', async () => {
          const mockUbicacionWithAllRelations = {
            ...mockExistingUbicacion,
            sucursal: { id: mockSucursalId, nombre: 'Sucursal Central' },
            contactos: [],
            equiposInventario: [],
          };
          (mockPrisma.ubicacion.findUnique as Mock).mockResolvedValue(mockUbicacionWithAllRelations);

          const ubicacion = await UbicacionService.getUbicacionById(mockUbicacionId);

          expect(mockPrisma.ubicacion.findUnique).toHaveBeenCalledTimes(1);
          expect(mockPrisma.ubicacion.findUnique).toHaveBeenCalledWith({
            where: { id: mockUbicacionId },
            include: { sucursal: true, contactos: true, equiposInventario: true },
          });
          expect(ubicacion).toEqual(mockUbicacionWithAllRelations);
        });

        it('debe retornar null si la ubicación no se encuentra', async () => {
          (mockPrisma.ubicacion.findUnique as Mock).mockResolvedValue(null);
          const ubicacion = await UbicacionService.getUbicacionById('non-existent-id');
          expect(ubicacion).toBeNull();
        });

        it('debe manejar errores cuando Prisma falla al obtener ubicación por ID', async () => {
          (mockPrisma.ubicacion.findUnique as Mock).mockRejectedValue(new Error('DB Error'));
          await expect(UbicacionService.getUbicacionById(mockUbicacionId)).rejects.toThrow('No se pudo obtener la ubicación.');
        });
      });

      // --- Pruebas para createUbicacion ---
      describe('createUbicacion', () => {
        const newUbicacionData: UbicacionCreateInput = {
          nombreReferencial: 'Nueva Sala',
          sucursalId: mockSucursalId,
          notas: 'Notas de la sala',
        };

        it('debe crear una nueva ubicación y retornar el objeto creado', async () => {
          (mockPrisma.ubicacion.create as Mock).mockResolvedValue({
            id: 'new-ubicacion-id',
            ...newUbicacionData,
            createdAt: new Date(), updatedAt: new Date(),
          });

          const ubicacion = await UbicacionService.createUbicacion(newUbicacionData);

          expect(mockPrisma.ubicacion.create).toHaveBeenCalledTimes(1);
          expect(mockPrisma.ubicacion.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
              nombreReferencial: newUbicacionData.nombreReferencial,
              sucursal: { connect: { id: newUbicacionData.sucursalId } },
              notas: newUbicacionData.notas,
            }),
          });
          expect(ubicacion).toHaveProperty('id', 'new-ubicacion-id');
          expect(ubicacion).toHaveProperty('nombreReferencial', 'Nueva Sala');
        });

        it('debe lanzar un error de validación Zod si los datos son inválidos', async () => {
          const invalidData = { ...newUbicacionData, sucursalId: 'invalid-uuid' }; // ID de sucursal inválido
          await expect(UbicacionService.createUbicacion(invalidData as any)).rejects.toThrow(/Error de validación al crear ubicación/);
          expect(mockPrisma.ubicacion.create).not.toHaveBeenCalled();
        });

        it('debe manejar otros errores de Prisma al crear ubicación', async () => {
          (mockPrisma.ubicacion.create as Mock).mockRejectedValue(new Error('Other DB Error'));
          await expect(UbicacionService.createUbicacion(newUbicacionData)).rejects.toThrow(/Error al crear la ubicación. Detalles: Other DB Error/);
        });
      });

      // --- Pruebas para updateUbicacion ---
      describe('updateUbicacion', () => {
        it('debe actualizar los campos de la ubicación y retornar el objeto actualizado', async () => {
          const updateData: UbicacionUpdateInput = {
            nombreReferencial: 'Piso 4 - Actualizado',
            notas: 'Notas actualizadas',
          };
          (mockPrisma.ubicacion.update as Mock).mockResolvedValue({ ...mockExistingUbicacion, ...updateData });

          const ubicacion = await UbicacionService.updateUbicacion(mockUbicacionId, updateData);

          expect(mockPrisma.ubicacion.update).toHaveBeenCalledTimes(1);
          expect(mockPrisma.ubicacion.update).toHaveBeenCalledWith({
            where: { id: mockUbicacionId },
            data: expect.objectContaining({
              nombreReferencial: 'Piso 4 - Actualizado',
              notas: 'Notas actualizadas',
            }),
          });
          expect(ubicacion).toHaveProperty('nombreReferencial', 'Piso 4 - Actualizado');
        });

        it('debe actualizar la sucursal si se proporciona un nuevo sucursalId', async () => {
          const newSucursalId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d09'; // Nuevo UUID válido
          const updateData: UbicacionUpdateInput = {
            sucursalId: newSucursalId,
          };
          (mockPrisma.ubicacion.update as Mock).mockResolvedValue({ ...mockExistingUbicacion, sucursalId: newSucursalId });

          const ubicacion = await UbicacionService.updateUbicacion(mockUbicacionId, updateData);

          expect(mockPrisma.ubicacion.update).toHaveBeenCalledTimes(1);
          expect(mockPrisma.ubicacion.update).toHaveBeenCalledWith({
            where: { id: mockUbicacionId },
            data: expect.objectContaining({
              sucursal: { connect: { id: newSucursalId } },
            }),
          });
          expect(ubicacion).toHaveProperty('sucursalId', newSucursalId);
        });

        it('debe lanzar un error de validación Zod si los datos son inválidos', async () => {
          const invalidData = { sucursalId: 'invalid-uuid-format' };
          await expect(UbicacionService.updateUbicacion(mockUbicacionId, invalidData as any)).rejects.toThrow(/Error de validación al actualizar ubicación/);
          expect(mockPrisma.ubicacion.update).not.toHaveBeenCalled();
        });

        it('debe manejar otros errores de Prisma al actualizar ubicación', async () => {
          const updateData = { nombreReferencial: 'Fail' };
          (mockPrisma.ubicacion.update as Mock).mockRejectedValue(new Error('Update DB Error'));
          await expect(UbicacionService.updateUbicacion(mockUbicacionId, updateData)).rejects.toThrow(/Error al actualizar la ubicación. Detalles: Update DB Error/);
        });
      });

      // --- Pruebas para deleteUbicacion ---
      describe('deleteUbicacion', () => {
        it('debe eliminar una ubicación si no tiene contactos ni equipos asociados', async () => {
          (mockPrisma.contactoEmpresa.count as Mock).mockResolvedValue(0);
          (mockPrisma.equipoInventario.count as Mock).mockResolvedValue(0);
          (mockPrisma.ubicacion.delete as Mock).mockResolvedValue({});

          const result = await UbicacionService.deleteUbicacion(mockUbicacionId);

          expect(mockPrisma.contactoEmpresa.count).toHaveBeenCalledWith({ where: { ubicacionId: mockUbicacionId } });
          expect(mockPrisma.equipoInventario.count).toHaveBeenCalledWith({ where: { ubicacionActualId: mockUbicacionId } });
          expect(mockPrisma.ubicacion.delete).toHaveBeenCalledWith({ where: { id: mockUbicacionId } });
          expect(result.success).toBe(true);
          expect(result.message).toBe('Ubicación eliminada exitosamente.');
        });

        it('NO debe eliminar la ubicación si tiene contactos asociados', async () => {
          (mockPrisma.contactoEmpresa.count as Mock).mockResolvedValue(1); // Simula 1 contacto
          // CORRECCIÓN: Usar rejects.toThrow ya que el servicio lanza el error.
          await expect(UbicacionService.deleteUbicacion(mockUbicacionId)).rejects.toThrow('No se puede eliminar la ubicación porque tiene contactos asociados.');
          expect(mockPrisma.ubicacion.delete).not.toHaveBeenCalled();
        });

        it('NO debe eliminar la ubicación si tiene equipos asociados', async () => {
          (mockPrisma.contactoEmpresa.count as Mock).mockResolvedValue(0);
          (mockPrisma.equipoInventario.count as Mock).mockResolvedValue(1); // Simula 1 equipo
          // CORRECCIÓN: Usar rejects.toThrow ya que el servicio lanza el error.
          await expect(UbicacionService.deleteUbicacion(mockUbicacionId)).rejects.toThrow('No se puede eliminar la ubicación porque tiene equipos de inventario asociados.');
          expect(mockPrisma.ubicacion.delete).not.toHaveBeenCalled();
        });

        it('debe manejar errores de Prisma al eliminar ubicación', async () => {
          (mockPrisma.contactoEmpresa.count as Mock).mockResolvedValue(0);
          (mockPrisma.equipoInventario.count as Mock).mockResolvedValue(0);
          (mockPrisma.ubicacion.delete as Mock).mockRejectedValue(new Error('Delete DB Error'));
          // CORRECCIÓN: Usar rejects.toThrow ya que el servicio lanza el error.
          await expect(UbicacionService.deleteUbicacion(mockUbicacionId)).rejects.toThrow('Error al eliminar la ubicación. Detalles: Delete DB Error');
        });
      });
    });
    