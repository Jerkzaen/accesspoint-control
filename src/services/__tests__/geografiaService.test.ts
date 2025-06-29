import { describe, it, expect, beforeEach, vi, type MockedObject } from 'vitest';
import { GeografiaService } from '../geografiaService';
import { prisma } from '../../lib/prisma';
import { Pais, Region, Provincia, Comuna, Ubicacion, EstadoUbicacion } from '@prisma/client';

// Mockeamos el módulo prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    pais: { findMany: vi.fn() as any, create: vi.fn() as any, update: vi.fn() as any, findUnique: vi.fn() as any },
    region: { findMany: vi.fn() as any, create: vi.fn() as any, update: vi.fn() as any, findUnique: vi.fn() as any },
    provincia: { findMany: vi.fn() as any, create: vi.fn() as any, update: vi.fn() as any, findUnique: vi.fn() as any },
    comuna: { findMany: vi.fn() as any, create: vi.fn() as any, update: vi.fn() as any, findUnique: vi.fn() as any },
    ubicacion: { findMany: vi.fn() as any, create: vi.fn() as any, update: vi.fn() as any, findUnique: vi.fn() as any }, // Añadido mock para ubicacion
    $transaction: vi.fn((callback: any) => Promise.resolve(callback(prisma as MockedObject<typeof prisma>))) as any,
    $disconnect: vi.fn() as any,
  },
}));

const mockPrisma = prisma as MockedObject<typeof prisma>;

describe('GeografiaService', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDate = new Date();

  // --- Pruebas para Países y Búsqueda (existentes, adaptadas si es necesario) ---
  describe('Países y Búsqueda', () => {
    it('getPaises: debe obtener una lista de países', async () => {
      const mockPaises: Pais[] = [{ id: '1', nombre: 'Chile', createdAt: mockDate, updatedAt: mockDate }];
      (mockPrisma.pais.findMany as any).mockResolvedValue(mockPaises);
      const paises = await GeografiaService.getPaises();
      expect(paises).toEqual(mockPaises);
    });

    it('createPais: debe crear un nuevo país', async () => {
      const mockPaisCreado: Pais = { id: '2', nombre: 'Argentina', createdAt: mockDate, updatedAt: mockDate };
      (mockPrisma.pais.create as any).mockResolvedValue(mockPaisCreado);
      const nuevoPais = await GeografiaService.createPais({ nombre: 'Argentina' });
      expect(nuevoPais).toEqual(mockPaisCreado);
    });

    it('debe manejar errores cuando Prisma falla al obtener países', async () => {
      (mockPrisma.pais.findMany as any).mockRejectedValue(new Error('DB Error Paises'));
      // Ajuste de mensaje esperado para que coincida con el servicio.
      await expect(GeografiaService.getPaises()).rejects.toThrow('No se pudieron obtener los países. Detalles: DB Error Paises');
    });
  });

  // --- Pruebas para Regiones (existentes, adaptadas si es necesario) ---
  describe('Regiones', () => {
    it('getRegionesByPais: debe obtener regiones por país', async () => {
      const PAIS_ID = 'pais-chile';
      const mockRegiones: Region[] = [{ id: 'reg-stgo', nombre: 'Metropolitana', paisId: PAIS_ID, createdAt: mockDate, updatedAt: mockDate }];
      (mockPrisma.region.findMany as any).mockResolvedValue(mockRegiones);
      const regiones = await GeografiaService.getRegionesByPais(PAIS_ID);
      expect(regiones).toEqual(mockRegiones);
    });

    it('debe manejar errores cuando Prisma falla al obtener regiones por país', async () => {
      (mockPrisma.region.findMany as any).mockRejectedValue(new Error('DB Error Regiones por País'));
      // Ajuste de mensaje esperado para que coincida con el servicio.
      await expect(GeografiaService.getRegionesByPais('some-id')).rejects.toThrow('No se pudieron obtener las regiones por país. Detalles: DB Error Regiones por País');
    });
  });

  // --- Pruebas para Provincias (existentes, adaptadas si es necesario) ---
  describe('Provincias', () => {
    it('getProvinciasByRegion: debe obtener provincias por región', async () => {
      const REGION_ID = 'reg-stgo';
      const mockProvincias: Provincia[] = [{ id: 'prov-stgo', nombre: 'Santiago', regionId: REGION_ID, createdAt: mockDate, updatedAt: mockDate }];
      (mockPrisma.provincia.findMany as any).mockResolvedValue(mockProvincias);
      const provincias = await GeografiaService.getProvinciasByRegion(REGION_ID);
      expect(provincias).toEqual(mockProvincias);
    });

    it('debe manejar errores cuando Prisma falla al obtener provincias por región', async () => {
      (mockPrisma.provincia.findMany as any).mockRejectedValue(new Error('DB Error Provincias por Región'));
      // Ajuste de mensaje esperado para que coincida con el servicio.
      await expect(GeografiaService.getProvinciasByRegion('some-id')).rejects.toThrow('No se pudieron obtener las provincias por región. Detalles: DB Error Provincias por Región');
    });
  });

  // --- Pruebas para Comunas (existentes, adaptadas si es necesario) ---
  describe('Comunas', () => {
    it('getComunasByProvincia: debe obtener comunas por provincia', async () => {
      const PROVINCIA_ID = 'prov-stgo';
      const mockComunas: Comuna[] = [{ id: 'com-lc', nombre: 'Las Condes', provinciaId: PROVINCIA_ID, createdAt: mockDate, updatedAt: mockDate }];
      (mockPrisma.comuna.findMany as any).mockResolvedValue(mockComunas);
      const comunas = await GeografiaService.getComunasByProvincia(PROVINCIA_ID);
      expect(comunas).toEqual(mockComunas);
    });

    it('debe manejar errores cuando Prisma falla al obtener comunas por provincia', async () => {
      (mockPrisma.comuna.findMany as any).mockRejectedValue(new Error('DB Error Comunas por Provincia'));
      // Ajuste de mensaje esperado para que coincida con el servicio.
      await expect(GeografiaService.getComunasByProvincia('some-id')).rejects.toThrow('No se pudieron obtener las comunas por provincia. Detalles: DB Error Comunas por Provincia');
    });
  });

  // --- NUEVAS Pruebas para Ubicaciones ---
  describe('Ubicaciones', () => {
    const MOCK_SUCURSAL_ID = 'mock-sucursal-id';
    const MOCK_UBICACION_ID = 'mock-ubicacion-id';
    const mockExistingUbicacion: Ubicacion = { // Aseguramos el tipo Ubicacion
      id: MOCK_UBICACION_ID,
      nombreReferencial: 'Oficina 101',
      sucursalId: MOCK_SUCURSAL_ID,
      notas: 'Notas de la ubicación',
      estado: EstadoUbicacion.ACTIVA,
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    it('getUbicacionesBySucursal: debe retornar ubicaciones activas por sucursal por defecto', async () => {
      const mockUbicaciones: Ubicacion[] = [
        { ...mockExistingUbicacion, id: 'ub-a', nombreReferencial: 'Ubi A', estado: EstadoUbicacion.ACTIVA },
        { ...mockExistingUbicacion, id: 'ub-b', nombreReferencial: 'Ubi B', estado: EstadoUbicacion.ACTIVA },
      ];
      (mockPrisma.ubicacion.findMany as any).mockResolvedValue(mockUbicaciones);

      const ubicaciones = await GeografiaService.getUbicacionesBySucursal(MOCK_SUCURSAL_ID);

      expect(mockPrisma.ubicacion.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.ubicacion.findMany).toHaveBeenCalledWith({
        where: { sucursalId: MOCK_SUCURSAL_ID, estado: EstadoUbicacion.ACTIVA },
        orderBy: { nombreReferencial: 'asc' },
      });
      expect(ubicaciones).toEqual(mockUbicaciones);
    });

    it('getUbicacionesBySucursal: debe retornar ubicaciones inactivas si se solicita', async () => {
      const mockUbicacionesInactivas: Ubicacion[] = [
        { ...mockExistingUbicacion, id: 'ub-c', nombreReferencial: 'Ubi C Inactiva', estado: EstadoUbicacion.INACTIVA },
      ];
      (mockPrisma.ubicacion.findMany as any).mockResolvedValue(mockUbicacionesInactivas);

      const ubicaciones = await GeografiaService.getUbicacionesBySucursal(MOCK_SUCURSAL_ID, EstadoUbicacion.INACTIVA);

      expect(mockPrisma.ubicacion.findMany).toHaveBeenCalledWith({
        where: { sucursalId: MOCK_SUCURSAL_ID, estado: EstadoUbicacion.INACTIVA },
        orderBy: { nombreReferencial: 'asc' },
      });
      expect(ubicaciones).toEqual(mockUbicacionesInactivas);
    });

    it('getUbicacionesBySucursal: debe manejar errores cuando Prisma falla al obtener ubicaciones', async () => {
      (mockPrisma.ubicacion.findMany as any).mockRejectedValue(new Error('DB Error Ubicaciones'));
      await expect(GeografiaService.getUbicacionesBySucursal(MOCK_SUCURSAL_ID)).rejects.toThrow('No se pudieron obtener las ubicaciones. Detalles: DB Error Ubicaciones');
    });

    it('createUbicacion: debe crear una nueva ubicación', async () => {
      const newUbicacionData = {
        nombreReferencial: 'Nueva Ubicación',
        sucursalId: MOCK_SUCURSAL_ID,
        notas: 'Notas de la nueva ubicación',
      };
      const mockCreatedUbicacion: Ubicacion = { ...mockExistingUbicacion, ...newUbicacionData, id: 'new-ubi-id', estado: EstadoUbicacion.ACTIVA };
      (mockPrisma.ubicacion.create as any).mockResolvedValue(mockCreatedUbicacion);

      const ubicacion = await GeografiaService.createUbicacion(newUbicacionData);

      expect(mockPrisma.ubicacion.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.ubicacion.create).toHaveBeenCalledWith({
        data: newUbicacionData,
      });
      expect(ubicacion).toEqual(mockCreatedUbicacion);
    });

    it('createUbicacion: debe manejar errores cuando Prisma falla al crear ubicación', async () => {
      (mockPrisma.ubicacion.create as any).mockRejectedValue(new Error('DB Error Create Ubicacion'));
      await expect(GeografiaService.createUbicacion({ nombreReferencial: 'Fail', sucursalId: MOCK_SUCURSAL_ID })).rejects.toThrow('No se pudo crear la ubicación. Detalles: DB Error Create Ubicacion');
    });

    it('updateUbicacion: debe actualizar una ubicación existente', async () => {
      const updateData = {
        nombreReferencial: 'Ubicación Actualizada',
        notas: 'Notas actualizadas',
      };
      const mockUpdatedUbicacion: Ubicacion = { ...mockExistingUbicacion, ...updateData };
      (mockPrisma.ubicacion.update as any).mockResolvedValue(mockUpdatedUbicacion);

      const ubicacion = await GeografiaService.updateUbicacion(MOCK_UBICACION_ID, updateData);

      expect(mockPrisma.ubicacion.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.ubicacion.update).toHaveBeenCalledWith({
        where: { id: MOCK_UBICACION_ID },
        data: updateData,
      });
      expect(ubicacion).toEqual(mockUpdatedUbicacion);
    });

    it('updateUbicacion: debe manejar errores cuando Prisma falla al actualizar ubicación', async () => {
      (mockPrisma.ubicacion.update as any).mockRejectedValue(new Error('DB Error Update Ubicacion'));
      await expect(GeografiaService.updateUbicacion(MOCK_UBICACION_ID, { nombreReferencial: 'Fail' })).rejects.toThrow('No se pudo actualizar la ubicación. Detalles: DB Error Update Ubicacion');
    });

    it('deactivateUbicacion: debe desactivar una ubicación', async () => {
      const mockDeactivatedUbicacion: Ubicacion = { ...mockExistingUbicacion, estado: EstadoUbicacion.INACTIVA };
      (mockPrisma.ubicacion.update as any).mockResolvedValue(mockDeactivatedUbicacion);

      const ubicacion = await GeografiaService.deactivateUbicacion(MOCK_UBICACION_ID);

      expect(mockPrisma.ubicacion.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.ubicacion.update).toHaveBeenCalledWith({
        where: { id: MOCK_UBICACION_ID },
        data: { estado: EstadoUbicacion.INACTIVA },
      });
      expect(ubicacion).toEqual(mockDeactivatedUbicacion);
    });

    it('deactivateUbicacion: debe manejar errores cuando Prisma falla al desactivar ubicación', async () => {
      (mockPrisma.ubicacion.update as any).mockRejectedValue(new Error('DB Error Deactivate Ubicacion'));
      // CORRECCIÓN: El servicio relanza el error directamente, no con un prefijo.
      await expect(GeografiaService.deactivateUbicacion(MOCK_UBICACION_ID)).rejects.toThrow('DB Error Deactivate Ubicacion');
    });
  });
});
