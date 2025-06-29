// src/services/geografiaService.ts

import { prisma } from "@/lib/prisma";
import { Pais, Region, Provincia, Comuna, Ubicacion, EstadoUbicacion, Prisma } from "@prisma/client";
import { ZodError } from "zod";


/**
 * Servicio para la gestión COMPLETA de datos geográficos.
 */
export class GeografiaService {

  // --- MÉTODOS DE LECTURA (con manejo de errores) ---
  static async getPaises(): Promise<Pais[]> {
    try {
      return await prisma.pais.findMany({ orderBy: { nombre: 'asc' } });
    } catch (error: any) {
      console.error("Error al obtener países:", error);
      throw new Error(`No se pudieron obtener los países. Detalles: ${error.message}`);
    }
  }
  static async getPaisById(id: string): Promise<Pais | null> {
    try {
      return await prisma.pais.findUnique({ where: { id } });
    } catch (error: any) {
      console.error(`Error al obtener país por ID ${id}:`, error);
      throw new Error(`No se pudo obtener el país. Detalles: ${error.message}`);
    }
  }
  
  static async getRegiones(): Promise<Region[]> {
    try {
      return await prisma.region.findMany({ include: { pais: true }, orderBy: { nombre: 'asc' } });
    } catch (error: any) {
      console.error("Error al obtener regiones:", error);
      throw new Error(`No se pudieron obtener las regiones. Detalles: ${error.message}`); // Corregido: eliminado 'new' duplicado
    }
  }
  static async getRegionById(id: string): Promise<Region | null> {
    try {
      return await prisma.region.findUnique({ where: { id }, include: { pais: true } });
    } catch (error: any) {
      console.error(`Error al obtener región por ID ${id}:`, error);
      throw new Error(`No se pudo obtener la región. Detalles: ${error.message}`);
    }
  }
  static async getRegionesByPais(paisId: string): Promise<Region[]> {
    try {
      return await prisma.region.findMany({ where: { paisId }, orderBy: { nombre: 'asc' } });
    } catch (error: any) {
      console.error(`Error al obtener regiones por país ${paisId}:`, error);
      throw new Error(`No se pudieron obtener las regiones por país. Detalles: ${error.message}`);
    }
  }

  static async getProvincias(): Promise<Provincia[]> {
    try {
      return await prisma.provincia.findMany({ include: { region: true }, orderBy: { nombre: 'asc' } });
    } catch (error: any) {
      console.error("Error al obtener provincias:", error);
      throw new Error(`No se pudieron obtener las provincias. Detalles: ${error.message}`);
    }
  }
  static async getProvinciaById(id: string): Promise<Provincia | null> {
    try {
      return await prisma.provincia.findUnique({ where: { id }, include: { region: true } });
    } catch (error: any) {
      console.error(`Error al obtener provincia por ID ${id}:`, error);
      throw new Error(`No se pudo obtener la provincia. Detalles: ${error.message}`);
    }
  }
  static async getProvinciasByRegion(regionId: string): Promise<Provincia[]> {
    try {
      return await prisma.provincia.findMany({ where: { regionId }, orderBy: { nombre: 'asc' } });
    } catch (error: any) {
      console.error(`Error al obtener provincias por región ${regionId}:`, error);
      throw new Error(`No se pudieron obtener las provincias por región. Detalles: ${error.message}`);
    }
  }
  
  static async getComunas(): Promise<Comuna[]> {
    try {
      return await prisma.comuna.findMany({ include: { provincia: true }, orderBy: { nombre: 'asc' } });
    }
    catch (error: any) {
      console.error("Error al obtener comunas:", error);
      throw new Error(`No se pudieron obtener las comunas. Detalles: ${error.message}`);
    }
  }
  static async getComunaById(id: string): Promise<Comuna | null> {
    try {
      return await prisma.comuna.findUnique({ where: { id }, include: { provincia: true } });
    } catch (error: any) {
      console.error(`Error al obtener comuna por ID ${id}:`, error);
      throw new Error(`No se pudo obtener la comuna. Detalles: ${error.message}`);
    }
  }
  static async getComunasByProvincia(provinciaId: string): Promise<Comuna[]> {
    try {
      return await prisma.comuna.findMany({ where: { provinciaId }, orderBy: { nombre: 'asc' } });
    } catch (error: any) {
      console.error(`Error al obtener comunas por provincia ${provinciaId}:`, error);
      throw new Error(`No se pudieron obtener las comunas por provincia. Detalles: ${error.message}`);
    }
  }

  static async searchComunas(searchTerm: string): Promise<Comuna[]> {
    try {
      if (!searchTerm.trim()) return [];
      return await prisma.comuna.findMany({
        where: { nombre: { contains: searchTerm } },
        include: { provincia: { include: { region: true } } },
        take: 10,
      });
    } catch (error: any) {
      console.error(`Error al buscar comunas con el término "${searchTerm}":`, error);
      throw new Error(`No se pudieron buscar las comunas. Detalles: ${error.message}`);
    }
  }

  // --- MÉTODOS PARA UBICACIONES (¡AHORA SÍ ESTÁTICOS Y CON MANEJO DE ERRORES!) ---
  static async getUbicacionesBySucursal(sucursalId: string, estado: EstadoUbicacion = EstadoUbicacion.ACTIVA): Promise<Ubicacion[]> {
    try {
      return await prisma.ubicacion.findMany({
        where: { sucursalId, estado },
        orderBy: { nombreReferencial: 'asc' },
      });
    } catch (error: any) {
      console.error(`Error al obtener ubicaciones para la sucursal ${sucursalId}:`, error);
      throw new Error(`No se pudieron obtener las ubicaciones. Detalles: ${error.message}`);
    }
  }

  static async getUbicacionById(id: string): Promise<Ubicacion | null> {
    try {
      return await prisma.ubicacion.findUnique({ where: { id } });
    } catch (error: any) {
      console.error(`Error al obtener ubicación por ID ${id}:`, error);
      throw new Error(`No se pudo obtener la ubicación. Detalles: ${error.message}`);
    }
  }

  static async createUbicacion(data: { nombreReferencial: string, sucursalId: string, notas?: string }): Promise<Ubicacion> {
    try {
      return await prisma.ubicacion.create({ data });
    } catch (error: any) {
      console.error("Error al crear ubicación:", error);
      throw new Error(`No se pudo crear la ubicación. Detalles: ${error.message}`);
    }
  }

  static async updateUbicacion(id: string, data: { nombreReferencial?: string, notas?: string }): Promise<Ubicacion> {
    try {
      return await prisma.ubicacion.update({ where: { id }, data });
    } catch (error: any) {
      console.error(`Error al actualizar ubicación ${id}:`, error);
      throw new Error(`No se pudo actualizar la ubicación. Detalles: ${error.message}`);
    }
  }

  /**
   * Desactiva una ubicación.
   */
  static async deactivateUbicacion(id: string): Promise<Ubicacion> {
    try {
      return await prisma.ubicacion.update({
        where: { id },
        data: { estado: EstadoUbicacion.INACTIVA },
      });
    } catch (error: any) {
      console.error(`Error al desactivar ubicación ${id}:`, error);
      throw error;
    }
  }

  // --- MÉTODOS DE ESCRITURA (con manejo de errores) ---
  static async createPais(data: { nombre: string }): Promise<Pais> {
    try {
      return await prisma.pais.create({ data });
    } catch (error: any) {
      console.error("Error al crear país:", error);
      throw new Error(`No se pudo crear el país. Detalles: ${error.message}`);
    }
  }
  static async updatePais(id: string, data: { nombre: string }): Promise<Pais> {
    try {
      return await prisma.pais.update({ where: { id }, data });
    } catch (error: any) {
      console.error(`Error al actualizar país ${id}:`, error);
      throw new Error(`No se pudo actualizar el país. Detalles: ${error.message}`);
    }
  }
  
  static async createRegion(data: { nombre: string, paisId: string }): Promise<Region> {
    try {
      return await prisma.region.create({ data });
    } catch (error: any) {
      console.error("Error al crear región:", error);
      throw new Error(`No se pudo crear la región. Detalles: ${error.message}`);
    }
  }
  static async updateRegion(id: string, data: { nombre: string, paisId?: string }): Promise<Region> {
    try {
      return await prisma.region.update({ where: { id }, data });
    } catch (error: any) {
      console.error(`Error al actualizar región ${id}:`, error);
      throw new Error(`No se pudo actualizar la región. Detalles: ${error.message}`);
    }
  }
  
  static async createProvincia(data: { nombre: string, regionId: string }): Promise<Provincia> {
    try {
      return await prisma.provincia.create({ data });
    } catch (error: any) {
      console.error("Error al crear provincia:", error);
      throw new Error(`No se pudo crear la provincia. Detalles: ${error.message}`);
    }
  }
  static async updateProvincia(id: string, data: { nombre: string, regionId?: string }): Promise<Provincia> {
    try {
      return await prisma.provincia.update({ where: { id }, data });
    } catch (error: any) {
      console.error(`Error al actualizar provincia ${id}:`, error);
      throw new Error(`No se pudo actualizar la provincia. Detalles: ${error.message}`);
    }
  }
  
  static async createComuna(data: { nombre: string, provinciaId: string }): Promise<Comuna> {
    try {
      return await prisma.comuna.create({ data });
    } catch (error: any) {
      console.error("Error al crear comuna:", error);
      throw new Error(`No se pudo crear la comuna. Detalles: ${error.message}`);
    }
  }
  static async updateComuna(id: string, data: { nombre: string, provinciaId?: string }): Promise<Comuna> {
    try {
      return await prisma.comuna.update({ where: { id }, data });
    } catch (error: any) {
      console.error(`Error al actualizar comuna ${id}:`, error);
      throw new Error(`No se pudo actualizar la comuna. Detalles: ${error.message}`);
    }
  }
}
