// src/services/geografiaService.ts

import { prisma } from "@/lib/prisma";
import type { Comuna, Direccion, Pais, Provincia, Region, Empresa, Sucursal } from '@prisma/client';

/**
 * Define el tipo de dato para una Comuna que incluye su Provincia y Región.
 * Esto es útil para tipar las respuestas de las funciones de servicio.
 */
export type ComunaConProvinciaYRegion = Comuna & {
  provincia: Provincia & {
    region: Region;
  };
};

/**
 * Define el tipo de dato para una Dirección que incluye Comuna, Provincia, Región y País.
 * Asegura la estructura completa de los datos de dirección.
 */
export type DireccionConRelaciones = Direccion & {
  comuna: Comuna & {
    provincia: Provincia & {
      region: Region & {
        pais: Pais;
      };
    };
  };
  // Ya no incluye 'empresa' directamente aquí; Empresa y Sucursal la referencian.
  empresasPrincipales?: Empresa[]; // Agregamos esta relación opcional si la Direccion es la principal de una empresa
  sucursales?: Sucursal[]; // Agregamos esta relación opcional
};

/**
 * Servicio para la gestión de datos geográficos (Países, Regiones, Provincias, Comunas, Direcciones).
 * Centraliza la lógica de acceso a la base de datos para la geografía.
 */
export class GeografiaService {

  /**
   * Obtiene todos los países ordenados alfabéticamente.
   * @returns Una promesa que resuelve con un array de objetos Pais.
   */
  static async getPaises(): Promise<Pais[]> {
    try {
      return await prisma.pais.findMany({
        orderBy: { nombre: 'asc' },
      });
    } catch (error) {
      console.error("Error al obtener países en GeografiaService:", error);
      throw new Error("No se pudieron obtener los países.");
    }
  }

  /**
   * Obtiene todas las regiones ordenadas alfabéticamente.
   * @returns Una promesa que resuelve con un array de objetos Region.
   */
  static async getRegiones(): Promise<Region[]> {
    try {
      return await prisma.region.findMany({
        orderBy: { nombre: 'asc' },
      });
    } catch (error) {
      console.error("Error al obtener regiones en GeografiaService:", error);
      throw new Error("No se pudieron obtener las regiones.");
    }
  }

  /**
   * Obtiene todas las provincias ordenadas alfabéticamente.
   * @returns Una promesa que resuelve con un array de objetos Provincia.
   */
  static async getProvincias(): Promise<Provincia[]> {
    try {
      return await prisma.provincia.findMany({
        orderBy: { nombre: 'asc' },
      });
    } catch (error) {
      console.error("Error al obtener provincias en GeografiaService:", error);
      throw new Error("No se pudieron obtener las provincias.");
    }
  }

  /**
   * Obtiene comunas por ID de región, incluyendo la provincia y la región.
   * La ComunaConProvinciaYRegion requiere la región anidada.
   * @param regionId El ID de la región.
   * @returns Una promesa que resuelve con un array de objetos ComunaConProvinciaYRegion.
   */
  static async getComunasByRegion(regionId: string): Promise<ComunaConProvinciaYRegion[]> {
    if (!regionId) {
      return [];
    }
    try {
      const comunas = await prisma.comuna.findMany({
        where: { provincia: { regionId: regionId } },
        include: { // Asegura que la región esté incluida para el tipo ComunaConProvinciaYRegion
          provincia: {
            include: {
              region: true,
            },
          },
        },
        orderBy: { nombre: 'asc' },
      });
      return comunas as ComunaConProvinciaYRegion[];
    } catch (error) {
      console.error("Error al obtener comunas por región en GeografiaService:", error);
      throw new Error("No se pudieron obtener las comunas para la región especificada.");
    }
  }

  /**
   * Busca comunas por un término de búsqueda, incluyendo provincia y región.
   * @param searchTerm El texto a buscar en los nombres de las comunas.
   * @returns Un array de objetos ComunaConProvinciaYRegion.
   */
  static async searchComunas(searchTerm: string): Promise<ComunaConProvinciaYRegion[]> {
    if (!searchTerm.trim()) {
      return [];
    }
    try {
      const comunas = await prisma.comuna.findMany({
        where: {
          nombre: {
            contains: searchTerm,
            // SQLite suele ser insensible a mayúsculas/minúsculas con 'contains'
          },
        },
        include: {
          provincia: {
            include: {
              region: true,
            },
          },
        },
        take: 10, // Limita la cantidad de resultados para mejor rendimiento
      });

      // Asegura que el tipo de retorno sea ComunaConProvinciaYRegion
      return comunas as ComunaConProvinciaYRegion[];
    } catch (error) {
      console.error('Error al buscar comunas en GeografiaService:', error);
      throw new Error('No se pudieron buscar las comunas.');
    }
  }

  /**
   * Obtiene todas las direcciones, incluyendo sus relaciones geográficas completas.
   * @returns Una promesa que resuelve con un array de objetos DireccionConRelaciones.
   */
  static async getDirecciones(): Promise<DireccionConRelaciones[]> {
    try {
      const direcciones = await prisma.direccion.findMany({
        include: {
          comuna: {
            include: {
              provincia: {
                include: {
                  region: {
                    include: {
                      pais: true,
                    },
                  },
                },
              },
            },
          },
          empresasPrincipales: { // Incluimos la nueva relación
            select: { id: true, nombre: true } // Selecciona solo los campos necesarios
          },
          sucursales: { // Incluimos la relación con sucursales
            select: { id: true, nombre: true }
          }
        },
        orderBy: { calle: "asc" },
      });
      return direcciones as DireccionConRelaciones[];
    } catch (error) {
      console.error("Error al obtener direcciones en GeografiaService:", error);
      throw new Error("No se pudieron obtener las direcciones.");
    }
  }

  /**
   * Añade una nueva dirección.
   * @param data Los datos de la nueva dirección (calle, numero, depto, comunaId).
   * @returns Una promesa que resuelve con el objeto Direccion creado.
   */
  static async addDireccion(data: { calle: string; numero: string; depto?: string; comunaId: string; }): Promise<Direccion> {
    try {
      const newDireccion = await prisma.direccion.create({
        data: {
          calle: data.calle,
          numero: data.numero,
          depto: data.depto,
          comuna: { connect: { id: data.comunaId } },
        },
      });
      return newDireccion;
    } catch (error) {
      console.error("Error al añadir dirección en GeografiaService:", error);
      throw new Error("Error al añadir dirección.");
    }
  }

  /**
   * Actualiza una dirección existente.
   * @param id El ID de la dirección a actualizar.
   * @param data Los datos a actualizar (parciales).
   * @returns Una promesa que resuelve con el objeto Direccion actualizado.
   */
  static async updateDireccion(id: string, data: { calle?: string; numero?: string; depto?: string; comunaId?: string; }): Promise<Direccion> {
    try {
      const updateData: any = {};
      if (data.calle !== undefined) updateData.calle = data.calle;
      if (data.numero !== undefined) updateData.numero = data.numero;
      if (data.depto !== undefined) updateData.depto = data.depto;
      if (data.comunaId !== undefined) updateData.comuna = { connect: { id: data.comunaId } };

      const updatedDireccion = await prisma.direccion.update({
        where: { id },
        data: updateData,
      });
      return updatedDireccion;
    } catch (error) {
      console.error("Error al actualizar dirección en GeografiaService:", error);
      throw new Error("Error al actualizar dirección.");
    }
  }

  /**
   * Elimina una dirección.
   * @param id El ID de la dirección a eliminar.
   * @returns Una promesa que resuelve cuando la dirección es eliminada.
   */
  static async deleteDireccion(id: string): Promise<void> {
    try {
      await prisma.direccion.delete({ where: { id } });
    } catch (error) {
      console.error("Error al eliminar dirección en GeografiaService:", error);
      throw new Error("Error al eliminar dirección. Asegúrate de que no esté asociada a ninguna empresa o sucursal.");
    }
  }

  /**
   * Obtiene todas las ubicaciones ordenadas alfabéticamente.
   * @returns Una promesa que resuelve con un array de objetos Ubicacion (incluyendo Sucursal y Empresa).
   */
  static async getUbicaciones(): Promise<(any)[]> { // 'any' temporal, si es necesario crear un tipo más específico
    try {
      const ubicaciones = await prisma.ubicacion.findMany({
        select: {
          id: true,
          nombreReferencial: true,
          sucursal: {
            select: {
              id: true,
              nombre: true,
              empresa: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
        orderBy: { nombreReferencial: 'asc' },
      });
      return ubicaciones;
    } catch (error) {
      console.error("Error al obtener ubicaciones en GeografiaService:", error);
      throw new Error("No se pudieron obtener las ubicaciones.");
    }
  }
}
