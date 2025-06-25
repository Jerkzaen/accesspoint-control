// src/services/__tests__/equipoInventarioService.test.ts

    // Importamos el servicio que vamos a probar
    import { EquipoInventarioService, EquipoInventarioCreateInput, EquipoInventarioUpdateInput } from '../equipoInventarioService';
    import { prisma } from '../../lib/prisma';
    import { Prisma, EstadoEquipoInventario, TipoEquipoInventario } from '@prisma/client'; // Importar enums y Prisma


    // Mockeamos el módulo 'prisma' para controlar el comportamiento de sus métodos.
    import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../lib/prisma', () => ({
      prisma: {
        // Métodos específicos de EquipoInventario
        equipoInventario: {
          findMany: vi.fn(),
          findUnique: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        },
        // Métodos de otras tablas que EquipoInventarioService usa
        equipoEnPrestamo: {
          count: vi.fn(), // Para la lógica de eliminación
        },
        // Mockeamos $transaction para que simplemente ejecute el callback que recibe
        $transaction: vi.fn((callback) => callback(prisma as unknown as vi.Mocked<typeof prisma>)), // Pasamos el mock de tx para funciones anidadas
        $disconnect: vi.fn(),
      },
    }));

    // Casteamos la instancia mockeada de prisma para un mejor tipado en las pruebas
    const mockPrisma = prisma as unknown as vi.Mocked<typeof prisma>;

    describe('EquipoInventarioService', () => {
      beforeEach(() => {
        vi.clearAllMocks();
      });

      const mockDate = new Date();
      const mockEquipoId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d08'; // UUID válido
      const mockUbicacionId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d06'; // UUID válido
      const mockEmpresaId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d01'; // UUID válido

      const mockExistingEquipo = {
        id: mockEquipoId,
        nombreDescriptivo: 'Laptop Lenovo X1',
        identificadorUnico: 'LENX1-001',
        tipoEquipo: TipoEquipoInventario.NOTEBOOK,
        marca: 'Lenovo',
        modelo: 'X1 Carbon',
        descripcionAdicional: null,
        estadoEquipo: EstadoEquipoInventario.DISPONIBLE,
        fechaAdquisicion: mockDate,
        proveedor: 'Proveedor ABC',
        ubicacionActualId: mockUbicacionId,
        notasGenerales: 'Notas del equipo',
        panelVtsSerie: null,
        pedalVtsSerie: null,
        biarticTipoDispositivo: null,
        empresaId: mockEmpresaId,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      // --- Pruebas para getEquiposInventario ---
      describe('getEquiposInventario', () => {
        it('debe retornar una lista de equipos ordenados alfabéticamente', async () => {
          const mockEquipos = [
            { ...mockExistingEquipo, id: 'e2', nombreDescriptivo: 'Monitor Dell' },
            { ...mockExistingEquipo, id: 'e1', nombreDescriptivo: 'Teclado Logitech' },
          ];
          (mockPrisma.equipoInventario.findMany as vi.Mock).mockResolvedValue(mockEquipos);

          const equipos = await EquipoInventarioService.getEquiposInventario();

          expect(mockPrisma.equipoInventario.findMany).toHaveBeenCalledTimes(1);
          expect(mockPrisma.equipoInventario.findMany).toHaveBeenCalledWith({
            include: undefined, // Se pasa undefined por defecto
            orderBy: { nombreDescriptivo: 'asc' },
          });
          expect(equipos).toEqual(mockEquipos);
        });

        it('debe incluir las relaciones si se solicita', async () => {
          const mockEquipoWithRelations = {
            ...mockExistingEquipo,
            ubicacionActual: { id: mockUbicacionId, nombreReferencial: 'Piso 2' },
            empresa: { id: mockEmpresaId, nombre: 'Empresa Cliente' },
            prestamos: [], // Vacío por simplicidad en este test
          };
          (mockPrisma.equipoInventario.findMany as vi.Mock).mockResolvedValue([mockEquipoWithRelations]);

          const equipos = await EquipoInventarioService.getEquiposInventario(true);

          expect(mockPrisma.equipoInventario.findMany).toHaveBeenCalledWith({
            include: { ubicacionActual: true, empresa: true, prestamos: true },
            orderBy: { nombreDescriptivo: 'asc' },
          });
          expect(equipos[0]).toHaveProperty('ubicacionActual');
          expect(equipos[0]).toHaveProperty('empresa');
          expect(equipos[0]).toHaveProperty('prestamos');
        });

        it('debe manejar errores cuando Prisma falla al obtener equipos', async () => {
          (mockPrisma.equipoInventario.findMany as vi.Mock).mockRejectedValue(new Error('DB Error'));
          await expect(EquipoInventarioService.getEquiposInventario()).rejects.toThrow('No se pudieron obtener los equipos de inventario.');
        });
      });

      // --- Pruebas para getEquipoInventarioById ---
      describe('getEquipoInventarioById', () => {
        it('debe retornar un equipo por su ID con todas las relaciones', async () => {
          const mockEquipoWithAllRelations = {
            ...mockExistingEquipo,
            ubicacionActual: { id: mockUbicacionId, nombreReferencial: 'Piso 2' },
            empresa: { id: mockEmpresaId, nombre: 'Empresa Cliente' },
            prestamos: [],
          };
          (mockPrisma.equipoInventario.findUnique as vi.Mock).mockResolvedValue(mockEquipoWithAllRelations);

          const equipo = await EquipoInventarioService.getEquipoInventarioById(mockEquipoId);

          expect(mockPrisma.equipoInventario.findUnique).toHaveBeenCalledTimes(1);
          expect(mockPrisma.equipoInventario.findUnique).toHaveBeenCalledWith({
            where: { id: mockEquipoId },
            include: {
              ubicacionActual: true,
              empresa: true,
              prestamos: { orderBy: { fechaPrestamo: 'desc' } },
            },
          });
          expect(equipo).toEqual(mockEquipoWithAllRelations);
        });

        it('debe retornar null si el equipo no se encuentra', async () => {
          (mockPrisma.equipoInventario.findUnique as vi.Mock).mockResolvedValue(null);
          const equipo = await EquipoInventarioService.getEquipoInventarioById('non-existent-id');
          expect(equipo).toBeNull();
        });

        it('debe manejar errores cuando Prisma falla al obtener equipo por ID', async () => {
          (mockPrisma.equipoInventario.findUnique as vi.Mock).mockRejectedValue(new Error('DB Error'));
          await expect(EquipoInventarioService.getEquipoInventarioById(mockEquipoId)).rejects.toThrow('No se pudo obtener el equipo de inventario.');
        });
      });

      // --- Pruebas para createEquipoInventario ---
      describe('createEquipoInventario', () => {
        const newEquipoData: EquipoInventarioCreateInput = {
          nombreDescriptivo: 'Nuevo Monitor',
          identificadorUnico: 'MON-001',
          tipoEquipo: TipoEquipoInventario.MONITOR,
          estadoEquipo: EstadoEquipoInventario.DISPONIBLE,
          ubicacionActualId: mockUbicacionId,
          empresaId: mockEmpresaId,
        };

        it('debe crear un nuevo equipo de inventario y retornar el objeto creado', async () => {
          (mockPrisma.equipoInventario.create as vi.Mock).mockResolvedValue({
            id: 'new-equipo-id',
            ...newEquipoData,
            createdAt: new Date(), updatedAt: new Date(),
          });

          const equipo = await EquipoInventarioService.createEquipoInventario(newEquipoData);

          expect(mockPrisma.equipoInventario.create).toHaveBeenCalledTimes(1);
          expect(mockPrisma.equipoInventario.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
              nombreDescriptivo: newEquipoData.nombreDescriptivo,
              identificadorUnico: newEquipoData.identificadorUnico,
              tipoEquipo: newEquipoData.tipoEquipo,
              estadoEquipo: newEquipoData.estadoEquipo,
              ubicacionActual: { connect: { id: newEquipoData.ubicacionActualId } },
              empresa: { connect: { id: newEquipoData.empresaId } },
            }),
          });
          expect(equipo).toHaveProperty('id', 'new-equipo-id');
          expect(equipo).toHaveProperty('nombreDescriptivo', 'Nuevo Monitor');
        });

        it('debe lanzar un error de validación Zod si los datos son inválidos', async () => {
          const invalidData = { ...newEquipoData, identificadorUnico: 'a' }; // Identificador muy corto
          await expect(EquipoInventarioService.createEquipoInventario(invalidData as any)).rejects.toThrow(/Error de validación al crear equipo/);
          expect(mockPrisma.equipoInventario.create).not.toHaveBeenCalled();
        });

        it('debe manejar errores de Prisma por identificador único duplicado', async () => {
          (mockPrisma.equipoInventario.create as vi.Mock).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }));
          await expect(EquipoInventarioService.createEquipoInventario(newEquipoData)).rejects.toThrow('El identificador único ya existe.');
        });

        it('debe manejar otros errores de Prisma al crear equipo', async () => {
          (mockPrisma.equipoInventario.create as vi.Mock).mockRejectedValue(new Error('Other DB Error'));
          await expect(EquipoInventarioService.createEquipoInventario(newEquipoData)).rejects.toThrow(/Error al crear el equipo de inventario. Detalles: Other DB Error/);
        });
      });

      // --- Pruebas para updateEquipoInventario ---
      describe('updateEquipoInventario', () => {
        it('debe actualizar los campos del equipo y retornar el objeto actualizado', async () => {
          const updateData: EquipoInventarioUpdateInput = {
            id: mockEquipoId,
            nombreDescriptivo: 'Laptop Actualizada',
            estadoEquipo: EstadoEquipoInventario.EN_MANTENIMIENTO,
          };
          (mockPrisma.equipoInventario.update as vi.Mock).mockResolvedValue({ ...mockExistingEquipo, ...updateData });

          const equipo = await EquipoInventarioService.updateEquipoInventario(updateData);

          expect(mockPrisma.equipoInventario.update).toHaveBeenCalledTimes(1);
          expect(mockPrisma.equipoInventario.update).toHaveBeenCalledWith({
            where: { id: updateData.id },
            data: expect.objectContaining({
              nombreDescriptivo: 'Laptop Actualizada',
              estadoEquipo: EstadoEquipoInventario.EN_MANTENIMIENTO,
            }),
          });
          expect(equipo).toHaveProperty('nombreDescriptivo', 'Laptop Actualizada');
        });

        it('debe actualizar la ubicación si se proporciona un nuevo ubicacionActualId', async () => {
          const newUbicacionId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d10'; // Nuevo UUID válido
          const updateData: EquipoInventarioUpdateInput = {
            id: mockEquipoId,
            ubicacionActualId: newUbicacionId,
          };
          (mockPrisma.equipoInventario.update as vi.Mock).mockResolvedValue({ ...mockExistingEquipo, ubicacionActualId: newUbicacionId });

          const equipo = await EquipoInventarioService.updateEquipoInventario(updateData);

          expect(mockPrisma.equipoInventario.update).toHaveBeenCalledTimes(1);
          expect(mockPrisma.equipoInventario.update).toHaveBeenCalledWith({
            where: { id: updateData.id },
            data: expect.objectContaining({
              ubicacionActual: { connect: { id: newUbicacionId } },
            }),
          });
          expect(equipo).toHaveProperty('ubicacionActualId', newUbicacionId);
        });

        it('debe desvincular la ubicación si ubicacionActualId se envía como null', async () => {
          const updateData: EquipoInventarioUpdateInput = {
            id: mockEquipoId,
            ubicacionActualId: null,
          };
          (mockPrisma.equipoInventario.update as vi.Mock).mockResolvedValue({ ...mockExistingEquipo, ubicacionActualId: null });

          const equipo = await EquipoInventarioService.updateEquipoInventario(updateData);

          expect(mockPrisma.equipoInventario.update).toHaveBeenCalledTimes(1);
          expect(mockPrisma.equipoInventario.update).toHaveBeenCalledWith({
            where: { id: updateData.id },
            data: expect.objectContaining({
              ubicacionActual: { disconnect: true },
            }),
          });
          expect(equipo).toHaveProperty('ubicacionActualId', null);
        });

        it('debe lanzar un error de validación Zod si los datos son inválidos', async () => {
          const invalidData = { ...mockExistingEquipo, id: mockEquipoId, identificadorUnico: 'a' };
          await expect(EquipoInventarioService.updateEquipoInventario(invalidData as any)).rejects.toThrow(/Error de validación al actualizar equipo/);
          expect(mockPrisma.equipoInventario.update).not.toHaveBeenCalled();
        });

        it('debe manejar errores de Prisma por identificador único duplicado al actualizar', async () => {
          (mockPrisma.equipoInventario.update as vi.Mock).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }));
          await expect(EquipoInventarioService.updateEquipoInventario({ id: mockEquipoId, identificadorUnico: 'DUP-001' })).rejects.toThrow('El identificador único ya existe.');
        });

        it('debe manejar otros errores de Prisma al actualizar equipo', async () => {
          const updateData = { id: mockEquipoId, nombreDescriptivo: 'Fail' };
          (mockPrisma.equipoInventario.update as vi.Mock).mockRejectedValue(new Error('Update DB Error'));
          await expect(EquipoInventarioService.updateEquipoInventario(updateData)).rejects.toThrow(/Error al actualizar el equipo de inventario. Detalles: Update DB Error/);
        });
      });

      // --- Pruebas para deleteEquipoInventario ---
      describe('deleteEquipoInventario', () => {
        it('debe eliminar un equipo si no tiene préstamos asociados', async () => {
          (mockPrisma.equipoEnPrestamo.count as vi.Mock).mockResolvedValue(0);
          (mockPrisma.equipoInventario.delete as vi.Mock).mockResolvedValue({});

          const result = await EquipoInventarioService.deleteEquipoInventario(mockEquipoId);

          expect(mockPrisma.equipoEnPrestamo.count).toHaveBeenCalledWith({ where: { equipoId: mockEquipoId } });
          expect(mockPrisma.equipoInventario.delete).toHaveBeenCalledWith({ where: { id: mockEquipoId } });
          expect(result.success).toBe(true);
          expect(result.message).toBe('Equipo de inventario eliminado exitosamente.');
        });

        it('NO debe eliminar el equipo si tiene préstamos asociados', async () => {
          (mockPrisma.equipoEnPrestamo.count as vi.Mock).mockResolvedValue(1);
          await expect(EquipoInventarioService.deleteEquipoInventario(mockEquipoId)).rejects.toThrow(/No se puede eliminar el equipo porque tiene registros de préstamos asociados./);
          expect(mockPrisma.equipoInventario.delete).not.toHaveBeenCalled();
        });

        it('debe manejar errores de Prisma al eliminar equipo', async () => {
          (mockPrisma.equipoEnPrestamo.count as vi.Mock).mockResolvedValue(0);
          (mockPrisma.equipoInventario.delete as vi.Mock).mockRejectedValue(new Error('Delete DB Error'));
          await expect(EquipoInventarioService.deleteEquipoInventario(mockEquipoId)).rejects.toThrow('Error al eliminar el equipo de inventario. Detalles: Delete DB Error');
        });
      });
    });