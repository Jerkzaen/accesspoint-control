// src/services/ubicacionService.ts

import { prisma } from "@/lib/prisma";
import { Prisma, Ubicacion, Sucursal, ContactoEmpresa, EquipoInventario } from "@prisma/client";
// Importamos los esquemas de validación Zod para Ubicacion
import { createUbicacionSchema, updateUbicacionSchema } from "@/lib/validators/ubicacionValidator";

/**
 * Define los tipos de entrada para las operaciones CRUD de Ubicacion.
 */
export type UbicacionCreateInput = {
  nombreReferencial?: string | null;
  sucursalId: string;
  notas?: string | null;
};

export type UbicacionUpdateInput = {
  id: string; // ID de la ubicación a actualizar
  nombreReferencial?: string | null;
  sucursalId?: string;
  notas?: string | null;
};

/**
 * Tipo para una Ubicacion con sus relaciones más comunes.
 */
export type UbicacionWithRelations = Ubicacion & {
  sucursal?: Sucursal | null;
  contactos?: ContactoEmpresa[];
  equiposInventario?: EquipoInventario[];
};

/**
 * Servicio para la gestión de Ubicaciones.
 * Centraliza la lógica de negocio y el acceso a la base de datos para las ubicaciones.
 */
export class UbicacionService {

  /**
   * Obtiene todas las ubicaciones, opcionalmente incluyendo sus relaciones.
   * @param includeRelations Indica si se deben incluir las relaciones de sucursal, contactos y equipos.
   * @returns Un array de objetos Ubicacion o UbicacionWithRelations.
   */
  static async getUbicaciones(includeRelations: boolean = false): Promise<Ubicacion[]> {
    try {
      const ubicaciones = await prisma.ubicacion.findMany({
        include: includeRelations ? {
          sucursal: true,
          contactos: true,
          equiposInventario: true,
        } : undefined,
        orderBy: { nombreReferencial: 'asc' },
      });
      return ubicaciones;
    } catch (error) {
      console.error("Error al obtener ubicaciones en UbicacionService:", error);
      throw new Error("No se pudieron obtener las ubicaciones.");
    }
  }

  /**
   * Obtiene una ubicación por su ID, incluyendo sus relaciones.
   * @param id El ID de la ubicación.
   * @returns El objeto UbicacionWithRelations o null si no se encuentra.
   */
  static async getUbicacionById(id: string): Promise<UbicacionWithRelations | null> {
    try {
      const ubicacion = await prisma.ubicacion.findUnique({
        where: { id },
        include: {
          sucursal: true,
          contactos: true,
          equiposInventario: true,
        },
      });
      return ubicacion;
    } catch (error) {
      console.error(`Error al obtener ubicación con ID ${id} en UbicacionService:`, error);
      throw new Error("No se pudo obtener la ubicación.");
    }
  }

  /**
   * Crea una nueva ubicación, validando los datos con Zod.
   * @param data Los datos para crear la ubicación.
   * @returns El objeto Ubicacion creado.
   */
  static async createUbicacion(data: UbicacionCreateInput): Promise<Ubicacion> {
    try {
      // Validar los datos de entrada con el esquema de creación de Zod
      const validatedData = createUbicacionSchema.parse(data);

      const newUbicacion = await prisma.$transaction(async (tx) => {
        const sucursalConnect = { connect: { id: validatedData.sucursalId } };

        const ubicacion = await tx.ubicacion.create({
          data: {
            nombreReferencial: validatedData.nombreReferencial,
            sucursal: sucursalConnect,
            notas: validatedData.notas,
          },
        });
        return ubicacion;
      });
      return newUbicacion;
    } catch (error) {
      console.error("Error al crear ubicación en UbicacionService:", error);
      if (error instanceof Error && 'issues' in error) { // ZodError
        throw new Error("Error de validación al crear ubicación: " + (error as any).issues.map((i: any) => i.message).join(", "));
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Añadir manejo específico de errores de Prisma si es necesario (ej. clave única)
      }
      throw new Error("Error al crear la ubicación. Detalles: " + (error as Error).message);
    }
  }

  /**
   * Actualiza una ubicación existente, validando los datos con Zod.
   * @param data Los datos para actualizar la ubicación (incluyendo el ID).
   * @returns El objeto Ubicacion actualizado.
   */
  static async updateUbicacion(data: UbicacionUpdateInput): Promise<Ubicacion> {
    try {
      // Validar los datos de entrada con el esquema de actualización de Zod
      const validatedData = updateUbicacionSchema.parse(data);

      const updatedUbicacion = await prisma.$transaction(async (tx) => {
        const sucursalUpdate = validatedData.sucursalId !== undefined
          ? { connect: { id: validatedData.sucursalId } }
          : undefined;

        const ubicacion = await tx.ubicacion.update({
          where: { id: validatedData.id },
          data: {
            nombreReferencial: validatedData.nombreReferencial,
            sucursal: sucursalUpdate,
            notas: validatedData.notas,
          },
        });
        return ubicacion;
      });
      return updatedUbicacion;
    } catch (error) {
      console.error(`Error al actualizar ubicación con ID ${data.id} en UbicacionService:`, error);
      if (error instanceof Error && 'issues' in error) { // ZodError
        throw new Error("Error de validación al actualizar ubicación: " + (error as any).issues.map((i: any) => i.message).join(", "));
      }
      throw new Error("Error al actualizar la ubicación. Detalles: " + (error as Error).message);
    }
  }

  /**
   * Elimina una ubicación.
   * Antes de eliminar, verifica si tiene contactos o equipos asociados.
   * @param id El ID de la ubicación a eliminar.
   * @returns Un objeto de éxito o error.
   */
  static async deleteUbicacion(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Verificar si la ubicación tiene contactos asociados
        const contactosCount = await tx.contactoEmpresa.count({
          where: { ubicacionId: id },
        });

        if (contactosCount > 0) {
          throw new Error("No se puede eliminar la ubicación porque tiene contactos asociados. Primero, desvincula o reasigna los contactos.");
        }

        // 2. Verificar si la ubicación tiene equipos de inventario asociados
        const equiposCount = await tx.equipoInventario.count({
          where: { ubicacionActualId: id },
        });

        if (equiposCount > 0) {
          throw new Error("No se puede eliminar la ubicación porque tiene equipos de inventario asociados. Primero, reasigna la ubicación de los equipos.");
        }

        // 3. Eliminar la ubicación
        await tx.ubicacion.delete({
          where: { id },
        });
      });
      return { success: true, message: "Ubicación eliminada exitosamente." };
    } catch (error: any) {
      console.error(`Error al eliminar ubicación con ID ${id} en UbicacionService:`, error);
      return { success: false, message: error.message || "Error al eliminar la ubicación." };
    }
  }
}
