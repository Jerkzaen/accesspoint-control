import { describe, it, expect, beforeEach } from 'vitest';

import { GeografiaService } from '../geografiaService';

let mockPrisma: any;
let geografiaService: GeografiaService;

describe('GeografiaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      pais: {
        findMany: vi.fn(),
      },
      region: {
        findMany: vi.fn(),
      },
      comuna: {
        findMany: vi.fn(),
      },
      direccion: {
        create: vi.fn(),
      },
    };
    geografiaService = new GeografiaService(mockPrisma);
  });






  describe('getPaises', () => {
    it('debe retornar una lista de países ordenados alfabéticamente', async () => {
      (mockPrisma.pais.findMany as vi.Mock).mockResolvedValue([
        { id: 'p1', nombre: 'País A', createdAt: new Date(), updatedAt: new Date(), regiones: [] },
        { id: 'p2', nombre: 'País B', createdAt: new Date(), updatedAt: new Date(), regiones: [] },
      ]);

      const paises = await geografiaService.getPaises();

      expect(mockPrisma.pais.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.pais.findMany).toHaveBeenCalledWith({
        orderBy: { nombre: 'asc' },
      });

      expect(paises).toEqual([
        { id: 'p1', nombre: 'País A', createdAt: expect.any(Date), updatedAt: expect.any(Date), regiones: [] },
        { id: 'p2', nombre: 'País B', createdAt: expect.any(Date), updatedAt: expect.any(Date), regiones: [] },
      ]);
    });

    it('debe manejar errores cuando Prisma falla al obtener países', async () => {
      (mockPrisma.pais.findMany as vi.Mock).mockRejectedValue(new Error('Error de DB'));
      await expect(geografiaService.getPaises()).rejects.toThrow('No se pudieron obtener los países.');
      expect(mockPrisma.pais.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRegiones', () => {
    it('debe retornar una lista de regiones ordenadas alfabéticamente', async () => {
      (mockPrisma.region.findMany as vi.Mock).mockResolvedValue([
        { id: 'r2', nombre: 'Región B', paisId: 'p1', createdAt: new Date(), updatedAt: new Date(), pais: null, provincias: [] },
        { id: 'r1', nombre: 'Región A', paisId: 'p1', createdAt: new Date(), updatedAt: new Date(), pais: null, provincias: [] },
      ]);

      const regiones = await geografiaService.getRegiones();

      expect(mockPrisma.region.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.region.findMany).toHaveBeenCalledWith({
        orderBy: { nombre: 'asc' },
      });
      expect(regiones).toEqual([
        expect.objectContaining({ nombre: 'Región B' }),
        expect.objectContaining({ nombre: 'Región A' }),
      ]);
    });

    it('debe manejar errores cuando Prisma falla al obtener regiones', async () => {
      (mockPrisma.region.findMany as vi.Mock).mockRejectedValue(new Error('Error de DB'));
      await expect(geografiaService.getRegiones()).rejects.toThrow('No se pudieron obtener las regiones.');
    });
  });

  describe('getComunasByRegion', () => {
    const mockComunas = [
      { id: 'c1', nombre: 'Comuna A', provinciaId: 'pr1', createdAt: new Date(), updatedAt: new Date(), provincia: { id: 'pr1', nombre: 'Provincia X', regionId: 'r1', createdAt: new Date(), updatedAt: new Date(), region: null, comunas: [] } },
      { id: 'c2', nombre: 'Comuna B', provinciaId: 'pr1', createdAt: new Date(), updatedAt: new Date(), provincia: { id: 'pr1', nombre: 'Provincia X', regionId: 'r1', createdAt: new Date(), updatedAt: new Date(), region: null, comunas: [] } },
    ];
    it('debe retornar una lista de comunas para una región específica', async () => {
      (mockPrisma.comuna.findMany as vi.Mock).mockResolvedValue(mockComunas);

      const comunas = await geografiaService.getComunasByRegion('r1');

      expect(mockPrisma.comuna.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.comuna.findMany).toHaveBeenCalledWith({
        where: { provincia: { regionId: 'r1' } },
        include: { provincia: { include: { region: true } } }, // <-- CORREGIDO
        orderBy: { nombre: 'asc' },
      });
      expect(comunas.length).toBe(2);
      expect(comunas[0]).toHaveProperty('nombre', 'Comuna A');
    });

    it('debe retornar un array vacío si regionId es null o undefined', async () => {
      const comunasNull = await geografiaService.getComunasByRegion(null as any);
      const comunasUndefined = await geografiaService.getComunasByRegion(undefined as any);

      expect(comunasNull).toEqual([]);
      expect(comunasUndefined).toEqual([]);
      expect(mockPrisma.comuna.findMany).not.toHaveBeenCalled();
    });

    it('debe manejar errores cuando Prisma falla al obtener comunas por región', async () => {
      (mockPrisma.comuna.findMany as vi.Mock).mockRejectedValue(new Error('Error de DB'));
      await expect(geografiaService.getComunasByRegion('r1')).rejects.toThrow('No se pudieron obtener las comunas para la región especificada.');
    });
  });

  describe('addDireccion', () => {
    // Usa un UUID válido para pasar la validación de Zod
    const validComunaId = 'b6e3e3b2-8c2e-4b2a-9b2e-8c2e4b2a9b2e';
    const newDireccionData = {
      calle: 'Calle Test',
      numero: '123',
      comunaId: validComunaId,
      depto: null
    };

    it('debe crear una nueva dirección y retornar el objeto creado', async () => {
      (mockPrisma.direccion.create as vi.Mock).mockResolvedValue({
        id: 'new-dir-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...newDireccionData,
      } as any);

      const direccion = await geografiaService.addDireccion(newDireccionData);

      expect(mockPrisma.direccion.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.direccion.create).toHaveBeenCalledWith({
        data: {
          calle: newDireccionData.calle,
          numero: newDireccionData.numero,
          depto: newDireccionData.depto,
          comuna: { connect: { id: newDireccionData.comunaId } },
        },
      });
      expect(direccion).toHaveProperty('id', 'new-dir-id');
      expect(direccion).toHaveProperty('calle', 'Calle Test');
    });

    it('debe lanzar un error de validación Zod si los datos son inválidos', async () => {
      const invalidData = { calle: '', numero: '123', comunaId: 'not-a-uuid' }; // Calle vacía y comunaId inválido
      await expect(geografiaService.addDireccion(invalidData as any)).rejects.toThrow(/Error de validación al añadir dirección/);
      expect(mockPrisma.direccion.create).not.toHaveBeenCalled();
    });

    it('debe manejar errores de Prisma al crear dirección', async () => {
      (mockPrisma.direccion.create as vi.Mock).mockRejectedValue(new Error('Error de Prisma simulado'));
      await expect(geografiaService.addDireccion(newDireccionData)).rejects.toThrowError(/Error al añadir dirección./);
    });
  });

  // Puedes continuar añadiendo pruebas para:
  // - searchComunas
  // - getDirecciones
  // - updateDireccion
  // - deleteDireccion
  // - getUbicaciones
});
