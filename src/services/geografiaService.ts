// src/services/geografiaService.ts

import { prisma } from "@/lib/prisma";
import { Pais, Region, Provincia, Comuna } from "@prisma/client";

/**
 * Servicio para la gestión COMPLETA de datos geográficos.
 */
export class GeografiaService {

  // --- MÉTODOS DE LECTURA ---
  static async getPaises(): Promise<Pais[]> { return prisma.pais.findMany({ orderBy: { nombre: 'asc' } }); }
  static async getPaisById(id: string): Promise<Pais | null> { return prisma.pais.findUnique({ where: { id } }); }
  
  static async getRegiones(): Promise<Region[]> { return prisma.region.findMany({ include: { pais: true }, orderBy: { nombre: 'asc' } }); }
  static async getRegionById(id: string): Promise<Region | null> { return prisma.region.findUnique({ where: { id }, include: { pais: true } }); }
  // CORRECCIÓN: Método reincorporado
  static async getRegionesByPais(paisId: string): Promise<Region[]> {
    return prisma.region.findMany({ where: { paisId }, orderBy: { nombre: 'asc' } });
  }

  static async getProvincias(): Promise<Provincia[]> { return prisma.provincia.findMany({ include: { region: true }, orderBy: { nombre: 'asc' } }); }
  static async getProvinciaById(id: string): Promise<Provincia | null> { return prisma.provincia.findUnique({ where: { id }, include: { region: true } }); }
  // CORRECCIÓN: Método reincorporado
  static async getProvinciasByRegion(regionId: string): Promise<Provincia[]> {
    return prisma.provincia.findMany({ where: { regionId }, orderBy: { nombre: 'asc' } });
  }
  
  static async getComunas(): Promise<Comuna[]> { return prisma.comuna.findMany({ include: { provincia: true }, orderBy: { nombre: 'asc' } }); }
  static async getComunaById(id: string): Promise<Comuna | null> { return prisma.comuna.findUnique({ where: { id }, include: { provincia: true } }); }
  // CORRECCIÓN: Método reincorporado
  static async getComunasByProvincia(provinciaId: string): Promise<Comuna[]> {
    return prisma.comuna.findMany({ where: { provinciaId }, orderBy: { nombre: 'asc' } });
  }

  static async searchComunas(searchTerm: string): Promise<Comuna[]> {
    if (!searchTerm.trim()) return [];
    return prisma.comuna.findMany({
      where: { nombre: { contains: searchTerm } },
      include: { provincia: { include: { region: true } } },
      take: 10,
    });
  }

  // --- MÉTODOS DE ESCRITURA ---
  static async createPais(data: { nombre: string }): Promise<Pais> { return prisma.pais.create({ data }); }
  static async updatePais(id: string, data: { nombre: string }): Promise<Pais> { return prisma.pais.update({ where: { id }, data }); }
  
  static async createRegion(data: { nombre: string, paisId: string }): Promise<Region> { return prisma.region.create({ data }); }
  static async updateRegion(id: string, data: { nombre: string, paisId?: string }): Promise<Region> { return prisma.region.update({ where: { id }, data }); }
  
  static async createProvincia(data: { nombre: string, regionId: string }): Promise<Provincia> { return prisma.provincia.create({ data }); }
  static async updateProvincia(id: string, data: { nombre: string, regionId?: string }): Promise<Provincia> { return prisma.provincia.update({ where: { id }, data }); }
  
  static async createComuna(data: { nombre: string, provinciaId: string }): Promise<Comuna> { return prisma.comuna.create({ data }); }
  static async updateComuna(id: string, data: { nombre: string, provinciaId?: string }): Promise<Comuna> { return prisma.comuna.update({ where: { id }, data }); }
}
