import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeografiaService } from '../geografiaService';
import { prisma } from '../../lib/prisma';
import { Pais, Region, Provincia, Comuna } from '@prisma/client';

// Mockeamos el módulo prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    pais: { findMany: vi.fn(), create: vi.fn() },
    region: { findMany: vi.fn(), create: vi.fn() },
    provincia: { findMany: vi.fn(), create: vi.fn() },
    comuna: { findMany: vi.fn(), create: vi.fn() },
  },
}));

describe('GeografiaService', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Países y Búsqueda', () => {
    it('getPaises: debe obtener una lista de países', async () => {
      const mockPaises: Pais[] = [{ id: '1', nombre: 'Chile', createdAt: new Date(), updatedAt: new Date() }];
      vi.mocked(prisma.pais.findMany).mockResolvedValue(mockPaises);
      const paises = await GeografiaService.getPaises();
      expect(paises).toEqual(mockPaises);
    });

    it('createPais: debe crear un nuevo país', async () => {
      const mockPaisCreado: Pais = { id: '2', nombre: 'Argentina', createdAt: new Date(), updatedAt: new Date() };
      vi.mocked(prisma.pais.create).mockResolvedValue(mockPaisCreado);
      const nuevoPais = await GeografiaService.createPais({ nombre: 'Argentina' });
      expect(nuevoPais).toEqual(mockPaisCreado);
    });
  });

  describe('Caso de Uso: Regiones de un País', () => {
    it('debe crear una nueva Región y luego poder listarla por País', async () => {
      const PAIS_ID = 'pais-chile-123';
      const mockRegionCreada: Region = { 
        id: 'region-rm-456', 
        nombre: 'Metropolitana', 
        paisId: PAIS_ID,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(prisma.region.create).mockResolvedValue(mockRegionCreada);
      const nuevaRegion = await GeografiaService.createRegion({ nombre: 'Metropolitana', paisId: PAIS_ID });
      expect(nuevaRegion.nombre).toBe('Metropolitana');

      vi.mocked(prisma.region.findMany).mockResolvedValue([mockRegionCreada]);
      const regionesDelPais = await GeografiaService.getRegionesByPais(PAIS_ID);
      
      expect(regionesDelPais).toContainEqual(mockRegionCreada);
    });
  });

  describe('Caso de Uso: Provincias de una Región', () => {
    it('debe crear una nueva Provincia y luego poder listarla por Región', async () => {
      const REGION_ID = 'region-rm-456';
      const mockProvinciaCreada: Provincia = {
        id: 'prov-stgo-789',
        nombre: 'Santiago',
        regionId: REGION_ID,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(prisma.provincia.create).mockResolvedValue(mockProvinciaCreada);
      const nuevaProvincia = await GeografiaService.createProvincia({ nombre: 'Santiago', regionId: REGION_ID });
      expect(nuevaProvincia.nombre).toBe('Santiago');

      vi.mocked(prisma.provincia.findMany).mockResolvedValue([mockProvinciaCreada]);
      const provinciasDeLaRegion = await GeografiaService.getProvinciasByRegion(REGION_ID);

      expect(provinciasDeLaRegion).toContainEqual(mockProvinciaCreada);
    });
  });

  describe('Caso de Uso: Comunas de una Provincia', () => {
    it('debe crear una nueva Comuna y luego poder listarla por Provincia', async () => {
      const PROVINCIA_ID = 'prov-stgo-789';
      const mockComunaCreada: Comuna = {
        id: 'com-lc-101',
        nombre: 'Las Condes',
        provinciaId: PROVINCIA_ID,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(prisma.comuna.create).mockResolvedValue(mockComunaCreada);
      const nuevaComuna = await GeografiaService.createComuna({ nombre: 'Las Condes', provinciaId: PROVINCIA_ID });
      expect(nuevaComuna.nombre).toBe('Las Condes');

      vi.mocked(prisma.comuna.findMany).mockResolvedValue([mockComunaCreada]);
      const comunasDeLaProvincia = await GeografiaService.getComunasByProvincia(PROVINCIA_ID);
      
      expect(comunasDeLaProvincia).toContainEqual(mockComunaCreada);
    });
  });
});

