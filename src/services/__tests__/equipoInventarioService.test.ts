// src/services/__tests__/equipoInventarioService.test.ts

// Importamos el servicio que vamos a probar
import { EquipoInventarioService, EquipoInventarioCreateInput, EquipoInventarioUpdateInput } from '../equipoInventarioService';
import { prisma } from '../../lib/prisma';
import { Prisma, EstadoEquipoInventario, TipoEquipoInventario } from '@prisma/client'; // Importar enums y Prisma
import { ZodError } from 'zod'; // Importar ZodError

// Mockeamos el módulo 'prisma' para controlar el comportamiento de sus métodos.
import { describe, it, expect, beforeEach, vi, type MockedObject, type Mock } from 'vitest';

vi.mock('../../lib/prisma', () => ({
      prisma: {
        // Métodos específicos de EquipoInventario
        equipoInventario: {
          findMany: vi.fn(),
          findUnique: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(), // Mantener delete mockeado si aún lo usa algún lugar o para testear que NO se llama.
        },
        // Métodos de otras tablas que EquipoInventarioService usa
        equipoEnPrestamo: {
          count: vi.fn(), // Para la lógica de desactivación
        },
        // Mockeamos $transaction para que simplemente ejecute el callback que recibe
        $transaction: vi.fn((callback) => callback(prisma as unknown as MockedObject<typeof prisma>)), // Pasamos el mock de tx para funciones anidadas
        $disconnect: vi.fn(),
      },
    }));

    // Casteamos la instancia mockeada de prisma para un mejor tipado en las pruebas
    const mockPrisma = prisma as unknown as MockedObject<typeof prisma>;

    // Definir un tipo para el mock del equipo con relaciones (solo las que realmente incluye el servicio)
    type EquipoInventarioWithAllRelations = Prisma.EquipoInventarioGetPayload<{
        include: {
            ubicacionActual: true;
            empresa: true;
            parentEquipo: true;
            componentes: true;
            prestamos: true;
        };
    }>;


    describe('EquipoInventarioService', () => {
      beforeEach(() => {
        vi.clearAllMocks();
      });

      const mockDate = new Date();
      const mockEquipoId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d08'; // UUID válido
      const mockUbicacionId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d06'; // UUID válido
      const mockEmpresaId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d01'; // UUID válido
      const mockUsuarioId = 'user-001';
      const mockLicenciaId = 'lic-001';
      const mockDongleId = 'dong-001';


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
        parentEquipoId: null,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      // Mock de Equipo con TODAS las relaciones para GET by ID
      const mockEquipoWithAllRelations: EquipoInventarioWithAllRelations = {
        ...mockExistingEquipo,
        ubicacionActual: { id: mockUbicacionId, nombreReferencial: 'Piso 2', sucursalId: 's1', estado: 'ACTIVA' as const, notas: null, createdAt: mockDate, updatedAt: mockDate },
        empresa: { id: mockEmpresaId, nombre: 'Empresa Cliente', rut: '12345678-9', estado: 'ACTIVA' as const, logoUrl: null, telefono: null, email: null, direccionPrincipalId: null, createdAt: mockDate, updatedAt: mockDate },
        parentEquipo: null,
        componentes: [],
        prestamos: [],
      };


      // --- Pruebas para getEquipos --- (Renombradas de getEquiposInventario)
      describe('getEquipos', () => {
        it('debe retornar una lista de equipos ordenados alfabéticamente incluyendo relaciones', async () => {
          const mockEquipos = [
            { ...mockExistingEquipo, id: 'e2', nombreDescriptivo: 'Monitor Dell' },
            { ...mockExistingEquipo, id: 'e1', nombreDescriptivo: 'Teclado Logitech' },
          ];
          // Asumimos que el servicio ya incluye las relaciones, así que el mock de Prisma puede devolver el equipo base
          (mockPrisma.equipoInventario.findMany as Mock).mockResolvedValue(mockEquipos);

          const equipos = await EquipoInventarioService.getEquipos(); // Llamada al método correcto

          expect(mockPrisma.equipoInventario.findMany).toHaveBeenCalledTimes(1);
          expect(mockPrisma.equipoInventario.findMany).toHaveBeenCalledWith({
            where: {}, // Sin filtro de estado por defecto
            include: { // Verificar que el servicio pide las inclusiones
              ubicacionActual: true,
              empresa: true,
              parentEquipo: true,
              componentes: true,
              prestamos: true,
            },
            orderBy: { nombreDescriptivo: 'asc' },
          });
          expect(equipos).toEqual(mockEquipos);
        });

        it('debe retornar una lista de equipos filtrados por estado', async () => {
          const mockEquiposFiltrados = [{ ...mockExistingEquipo, estadoEquipo: EstadoEquipoInventario.EN_USO_INTERNO }];
          (mockPrisma.equipoInventario.findMany as Mock).mockResolvedValue(mockEquiposFiltrados);

          const equipos = await EquipoInventarioService.getEquipos(EstadoEquipoInventario.EN_USO_INTERNO); // Llamada con filtro

          expect(mockPrisma.equipoInventario.findMany).toHaveBeenCalledWith({
            where: { estadoEquipo: EstadoEquipoInventario.EN_USO_INTERNO },
            include: { // Verificar que el servicio pide las inclusiones
              ubicacionActual: true,
              empresa: true,
              parentEquipo: true,
              componentes: true,
              prestamos: true,
            },
            orderBy: { nombreDescriptivo: 'asc' },
          });
          expect(equipos).toEqual(mockEquiposFiltrados);
        });

        it('debe manejar errores cuando Prisma falla al obtener equipos', async () => {
          (mockPrisma.equipoInventario.findMany as Mock).mockRejectedValue(new Error('DB Error Generico'));
          await expect(EquipoInventarioService.getEquipos()).rejects.toThrow('No se pudieron obtener los equipos. Detalles: DB Error Generico');
        });
      });

      // --- Pruebas para getEquipoById --- (Renombradas de getEquipoInventarioById)
      describe('getEquipoById', () => {
        it('debe retornar un equipo por su ID con todas las relaciones', async () => {
          (mockPrisma.equipoInventario.findUnique as Mock).mockResolvedValue(mockEquipoWithAllRelations);

          const equipo = await EquipoInventarioService.getEquipoById(mockEquipoId); // Llamada al método correcto

          expect(mockPrisma.equipoInventario.findUnique).toHaveBeenCalledTimes(1);
          expect(mockPrisma.equipoInventario.findUnique).toHaveBeenCalledWith({
            where: { id: mockEquipoId },
            include: { // Verificar que el servicio pide todas las inclusiones definidas
              ubicacionActual: true,
              empresa: true,
              parentEquipo: true,
              componentes: true,
              prestamos: true,
            },
          });
          expect(equipo).toEqual(mockEquipoWithAllRelations);
        });

        it('debe retornar null si el equipo no se encuentra', async () => {
          (mockPrisma.equipoInventario.findUnique as Mock).mockResolvedValue(null);
          const equipo = await EquipoInventarioService.getEquipoById('non-existent-id'); // Llamada al método correcto
          expect(equipo).toBeNull();
        });

        it('debe manejar errores cuando Prisma falla al obtener equipo por ID', async () => {
          (mockPrisma.equipoInventario.findUnique as Mock).mockRejectedValue(new Error('DB Error by ID'));
          await expect(EquipoInventarioService.getEquipoById(mockEquipoId)).rejects.toThrow('No se pudo obtener el equipo. Detalles: DB Error by ID'); // Mensaje ajustado
        });
      });

      // --- Pruebas para createEquipo --- (Renombradas de createEquipoInventario)
      describe('createEquipo', () => {
        const newEquipoData: EquipoInventarioCreateInput = {
          nombreDescriptivo: 'Nuevo Monitor',
          identificadorUnico: 'MON-001',
          tipoEquipo: TipoEquipoInventario.MONITOR,
          estadoEquipo: EstadoEquipoInventario.DISPONIBLE,
          ubicacionActualId: mockUbicacionId,
          empresaId: mockEmpresaId,
          // Añadir aquí otros campos requeridos por tu schema o validador si aplica
        };

        it('debe crear un nuevo equipo de inventario y retornar el objeto creado', async () => {
          const mockCreatedEquipo = {
            id: 'new-equipo-id',
            ...newEquipoData,
            createdAt: new Date(), updatedAt: new Date(),
          };
          (mockPrisma.equipoInventario.create as Mock).mockResolvedValue(mockCreatedEquipo);

          const equipo = await EquipoInventarioService.createEquipo(newEquipoData); // Llamada al método correcto

          expect(mockPrisma.equipoInventario.create).toHaveBeenCalledTimes(1);
          // Verificar que los datos pasados a Prisma son correctos y completos
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
          expect(equipo).toEqual(mockCreatedEquipo);
        });

        it('debe lanzar un error de validación Zod si los datos son inválidos', async () => {
          const invalidData = { ...newEquipoData, identificadorUnico: 'a' }; // Identificador muy corto
          // El servicio valida directamente antes de llamar a Prisma
          await expect(EquipoInventarioService.createEquipo(invalidData as any)).rejects.toThrow('Error de validación al crear equipo: El identificador único es requerido.');
        });

        it('debe manejar errores de Prisma por identificador único duplicado', async () => {
          (mockPrisma.equipoInventario.create as Mock).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', meta: { target: ['identificadorUnico'] }, clientVersion: 'test' }));
          await expect(EquipoInventarioService.createEquipo(newEquipoData)).rejects.toThrow('Ya existe un equipo con este identificador único.');
        });

        it('debe manejar otros errores de Prisma al crear equipo', async () => {
          (mockPrisma.equipoInventario.create as Mock).mockRejectedValue(new Error('Other DB Error Create'));
          await expect(EquipoInventarioService.createEquipo(newEquipoData)).rejects.toThrow('No se pudo crear el equipo. Detalles: Other DB Error Create');
        });
      });

      // --- Pruebas para updateEquipo --- (Renombradas de updateEquipoInventario)
      describe('updateEquipo', () => {
        it('debe actualizar los campos del equipo y retornar el objeto actualizado', async () => {
          const updateData: EquipoInventarioUpdateInput = {
            id: mockEquipoId,
            nombreDescriptivo: 'Laptop Actualizada',
            estadoEquipo: EstadoEquipoInventario.EN_MANTENIMIENTO,
          };
          const mockUpdatedEquipo = { ...mockExistingEquipo, ...updateData };
          (mockPrisma.equipoInventario.update as Mock).mockResolvedValue(mockUpdatedEquipo);

          const equipo = await EquipoInventarioService.updateEquipo(mockEquipoId, updateData); // Llamada al método correcto

          expect(mockPrisma.equipoInventario.update).toHaveBeenCalledTimes(1);
          expect(mockPrisma.equipoInventario.update).toHaveBeenCalledWith({
            where: { id: mockEquipoId }, // Usar mockEquipoId directamente aquí
            data: expect.objectContaining({
              nombreDescriptivo: 'Laptop Actualizada',
              estadoEquipo: EstadoEquipoInventario.EN_MANTENIMIENTO,
            }),
          });
          expect(equipo).toEqual(mockUpdatedEquipo);
        });

        it('debe actualizar la ubicación si se proporciona un nuevo ubicacionActualId', async () => {
          const newUbicacionId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d10';
          const updateData: EquipoInventarioUpdateInput = {
            id: mockEquipoId,
            ubicacionActualId: newUbicacionId,
          };
          (mockPrisma.equipoInventario.update as Mock).mockResolvedValue({ ...mockExistingEquipo, ubicacionActualId: newUbicacionId });

          const equipo = await EquipoInventarioService.updateEquipo(mockEquipoId, updateData); // Llamada al método correcto

          expect(mockPrisma.equipoInventario.update).toHaveBeenCalledTimes(1);
          expect(mockPrisma.equipoInventario.update).toHaveBeenCalledWith({
            where: { id: mockEquipoId },
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
          (mockPrisma.equipoInventario.update as Mock).mockResolvedValue({ ...mockExistingEquipo, ubicacionActualId: null });

          const equipo = await EquipoInventarioService.updateEquipo(mockEquipoId, updateData); // Llamada al método correcto

          expect(mockPrisma.equipoInventario.update).toHaveBeenCalledTimes(1);
          expect(mockPrisma.equipoInventario.update).toHaveBeenCalledWith({
            where: { id: mockEquipoId },
            data: expect.objectContaining({
              ubicacionActual: { disconnect: true },
            }),
          });
          expect(equipo).toHaveProperty('ubicacionActualId', null);
        });

        it('debe lanzar un error de validación Zod si los datos son inválidos', async () => {
          const invalidData = { ...mockExistingEquipo, id: mockEquipoId, identificadorUnico: 'a' };
          // El servicio valida directamente antes de llamar a Prisma
          await expect(EquipoInventarioService.updateEquipo(mockEquipoId, invalidData as any)).rejects.toThrow('Error de validación al actualizar equipo: El identificador único es requerido y debe tener al menos 3 caracteres.');
        });

        it('debe manejar errores de Prisma por identificador único duplicado al actualizar', async () => {
          (mockPrisma.equipoInventario.update as Mock).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', meta: { target: ['identificadorUnico'] }, clientVersion: 'test' }));
          await expect(EquipoInventarioService.updateEquipo(mockEquipoId, { id: mockEquipoId, identificadorUnico: 'DUP-001' })).rejects.toThrow('El identificador único ya existe.');
        });

        it('debe manejar errores de Prisma por equipo no encontrado', async () => {
            const validUuid = '12345678-1234-1234-1234-123456789012'; // UUID válido para evitar error de validación
            (mockPrisma.equipoInventario.update as Mock).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Record not found', { code: 'P2025', clientVersion: 'test' }));
            await expect(EquipoInventarioService.updateEquipo(validUuid, { id: validUuid, nombreDescriptivo: 'Test' })).rejects.toThrow('Equipo no encontrado para actualizar.');
        });

        it('debe manejar otros errores de Prisma al actualizar equipo', async () => {
          const updateData = { id: mockEquipoId, nombreDescriptivo: 'Fail' };
          (mockPrisma.equipoInventario.update as Mock).mockRejectedValue(new Error('Update DB Error'));
          await expect(EquipoInventarioService.updateEquipo(mockEquipoId, updateData)).rejects.toThrow('No se pudo actualizar el equipo. Detalles: Update DB Error');
        });
      });

      // --- Pruebas para deactivateEquipo --- (Renombradas de deleteEquipoInventario)
      describe('deactivateEquipo', () => {
        it('debe desactivar un equipo si no tiene préstamos asociados y no está prestado', async () => {
          // Simula que el equipo NO está PRESTADO (estado DISPONIBLE) y no tiene préstamos registrados.
          (mockPrisma.equipoInventario.findUnique as Mock).mockResolvedValue({ ...mockExistingEquipo, estadoEquipo: EstadoEquipoInventario.DISPONIBLE });
          (mockPrisma.equipoInventario.update as Mock).mockResolvedValue({ ...mockExistingEquipo, estadoEquipo: EstadoEquipoInventario.DE_BAJA });

          const result = await EquipoInventarioService.deactivateEquipo(mockEquipoId);

          expect(mockPrisma.equipoInventario.findUnique).toHaveBeenCalledWith({ where: { id: mockEquipoId } });
          expect(mockPrisma.equipoInventario.update).toHaveBeenCalledWith({ where: { id: mockEquipoId }, data: { estadoEquipo: EstadoEquipoInventario.DE_BAJA } });
          expect(result).toHaveProperty('estadoEquipo', EstadoEquipoInventario.DE_BAJA);
        });

        it('debe lanzar error si el equipo no se encuentra al intentar desactivar', async () => {
            (mockPrisma.equipoInventario.findUnique as Mock).mockResolvedValue(null); // No encuentra el equipo
            await expect(EquipoInventarioService.deactivateEquipo('non-existent-id')).rejects.toThrow('Equipo no encontrado para desactivar.');
            expect(mockPrisma.equipoInventario.update).not.toHaveBeenCalled();
        });

        it('NO debe desactivar el equipo si está PRESTADO', async () => {
          (mockPrisma.equipoInventario.findUnique as Mock).mockResolvedValue({ ...mockExistingEquipo, estadoEquipo: EstadoEquipoInventario.PRESTADO });
          await expect(EquipoInventarioService.deactivateEquipo(mockEquipoId)).rejects.toThrow('No se puede dar de baja un equipo que está prestado.');
          expect(mockPrisma.equipoInventario.update).not.toHaveBeenCalled();
        });

        it('debe manejar errores de Prisma por Foreign Key Constraint al desactivar', async () => {
            (mockPrisma.equipoInventario.findUnique as Mock).mockResolvedValue({ ...mockExistingEquipo, estadoEquipo: EstadoEquipoInventario.DISPONIBLE });
            (mockPrisma.equipoInventario.update as Mock).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', { code: 'P2003', clientVersion: 'test' }));
            await expect(EquipoInventarioService.deactivateEquipo(mockEquipoId)).rejects.toThrow('No se puede desactivar el equipo debido a elementos asociados (préstamos, tickets).');
        });

        it('debe manejar otros errores de Prisma al desactivar equipo', async () => {
          (mockPrisma.equipoInventario.findUnique as Mock).mockResolvedValue({ ...mockExistingEquipo, estadoEquipo: EstadoEquipoInventario.DISPONIBLE });
          (mockPrisma.equipoInventario.update as Mock).mockRejectedValue(new Error('Deactivate DB Error'));
          await expect(EquipoInventarioService.deactivateEquipo(mockEquipoId)).rejects.toThrow('Deactivate DB Error'); // El servicio relanza el error directamente si no es P2003
        });
      });
    });
