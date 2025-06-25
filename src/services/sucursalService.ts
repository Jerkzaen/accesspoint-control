// src/services/sucursalService.ts

import { prisma } from "@/lib/prisma";
import { Prisma, Sucursal, Empresa, Direccion, Ubicacion, Ticket } from "@prisma/client";
import { createSucursalSchema, updateSucursalSchema } from "@/lib/validators/sucursalValidator";
import { ZodError } from "zod";

/**
 * Define los tipos de entrada para las operaciones CRUD de Sucursal.
 * Ajustamos los tipos para que coincidan con la forma en que Prisma espera las conexiones.
 */
export type SucursalCreateInput = {
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  empresaId?: string; // Usaremos este campo para la entrada
  direccion: {
    calle: string;
    numero: string;
    depto?: string | null;
    comunaId: string;
  };
};

export type SucursalUpdateInput = {
  id: string; // Para identificar la sucursal a actualizar
  nombre?: string;
  telefono?: string | null;
  email?: string | null;
  empresaId?: string | null; // Puede ser null para desvincular
  direccion?: {
    id?: string; // Si se actualiza una dirección existente
    calle?: string;
    numero?: string;
    depto?: string | null;
    comunaId?: string;
  };
};

/**
 * Tipo para una Sucursal con sus relaciones más comunes.
 */
export type SucursalWithRelations = Sucursal & {
  empresa?: Empresa | null;
  direccion?: Direccion | null;
  ubicaciones?: Ubicacion[];
  tickets?: Ticket[];
};

/**
 * Servicio para la gestión de Sucursales.
 * Centraliza la lógica de negocio y el acceso a la base de datos para las Sucursales.
 */
export class SucursalService {

  /**
   * Obtiene todas las sucursales, opcionalmente incluyendo su empresa y dirección.
   * @param includeRelations Indica si se deben incluir las relaciones de empresa y dirección.
   * @returns Un array de objetos Sucursal o SucursalWithRelations.
   */
  static async getSucursales(includeRelations: boolean = false): Promise<Sucursal[]> {
    try {
      const sucursales = await prisma.sucursal.findMany({
        include: {
          empresa: includeRelations,
          direccion: includeRelations,
        },
        orderBy: { nombre: 'asc' },
      });
      return sucursales;
    } catch (error) {
      console.error("Error al obtener sucursales en SucursalService:", error);
      throw new Error("No se pudieron obtener las sucursales.");
    }
  }

  /**
   * Obtiene una sucursal por su ID, incluyendo sus relaciones.
   * @param id El ID de la sucursal.
   * @returns El objeto SucursalWithRelations o null si no se encuentra.
   */
  static async getSucursalById(id: string): Promise<SucursalWithRelations | null> {
    try {
      const sucursal = await prisma.sucursal.findUnique({
        where: { id },
        include: {
          empresa: true,
          direccion: {
            include: {
              comuna: {
                include: {
                  provincia: {
                    include: {
                      region: true,
                    },
                  },
                },
              },
            },
          },
          ubicaciones: true,
          tickets: true,
        },
      });
      return sucursal;
    } catch (error) {
      console.error(`Error al obtener sucursal con ID ${id} en SucursalService:`, error);
      throw new Error("No se pudo obtener la sucursal.");
    }
  }

  /**
   * Crea una nueva sucursal, incluyendo la creación de su dirección asociada.
   * Utiliza una transacción para asegurar que ambas operaciones sean atómicas.
   * @param data Los datos para crear la sucursal y su dirección.
   * @returns El objeto Sucursal creado.
   */
  static async createSucursal(data: SucursalCreateInput): Promise<Sucursal> {
    try {
      // Validación Zod
      createSucursalSchema.parse(data);
      const newSucursal = await prisma.$transaction(async (tx) => {
        // 1. Crear la dirección asociada a la sucursal
        const nuevaDireccion = await tx.direccion.create({
          data: {
            calle: data.direccion.calle,
            numero: data.direccion.numero,
            depto: data.direccion.depto,
            comuna: { connect: { id: data.direccion.comunaId } },
          },
        });

        // 2. Preparar los datos de conexión para la empresa
        const empresaConnect = data.empresaId ? { connect: { id: data.empresaId } } : undefined;

        // 3. Crear la sucursal vinculada a la nueva dirección y empresa
        const sucursal = await tx.sucursal.create({
          data: {
            nombre: data.nombre,
            telefono: data.telefono,
            email: data.email,
            direccion: { connect: { id: nuevaDireccion.id } }, // Conectar a la nueva dirección
            empresa: empresaConnect, // Conectar a la empresa si se proporciona
          },
        });
        return sucursal;
      });
      return newSucursal;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error("Error de validación: " + error.errors.map(e => e.message).join(", "));
      }
      console.error("Error al crear sucursal en SucursalService:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002' && error.meta?.target === 'sucursales_direccionId_key') {
          throw new Error("La dirección ya está asociada a otra sucursal. Una dirección solo puede tener una sucursal.");
        }
      }
      throw new Error("Error al crear la sucursal. Detalles: " + (error as Error).message);
    }
  }

  /**
   * Actualiza una sucursal existente, incluyendo opcionalmente su dirección y/o empresa.
   * Utiliza una transacción para asegurar que todas las operaciones sean atómicas.
   * @param data Los datos para actualizar la sucursal y/o su dirección.
   * @returns El objeto Sucursal actualizado.
   */
  static async updateSucursal(data: SucursalUpdateInput): Promise<Sucursal> {
    try {
      // Validación Zod
      updateSucursalSchema.parse(data);
      const updatedSucursal = await prisma.$transaction(async (tx) => {
        // Si hay datos para actualizar la dirección, manejarlos primero
        if (data.direccion !== undefined) {
          if (data.direccion.id) { // Si se proporciona un ID de dirección, actualizar la existente
            await tx.direccion.update({
              where: { id: data.direccion.id },
              data: {
                calle: data.direccion.calle,
                numero: data.direccion.numero,
                depto: data.direccion.depto,
                comuna: data.direccion.comunaId ? { connect: { id: data.direccion.comunaId } } : undefined,
              },
            });
          } else {
            // Lógica para crear una nueva dirección si se quiere cambiar la dirección a una nueva.
            // Por ahora, si no hay ID de dirección, esta parte no actualizará la dirección.
            console.warn("Se intentó actualizar la dirección de una sucursal sin proporcionar el ID de la dirección. La dirección no será actualizada.");
          }
        }

        // Preparamos los datos de la sucursal para la actualización
        const sucursalUpdateData: Prisma.SucursalUpdateInput = {
          nombre: data.nombre,
          telefono: data.telefono,
          email: data.email,
        };

        // Si se proporciona empresaId, conectar/desconectar
        if (data.empresaId !== undefined) {
          sucursalUpdateData.empresa = data.empresaId === null
            ? { disconnect: true }
            : data.empresaId
              ? { connect: { id: data.empresaId } }
              : undefined; // No hacer nada si es undefined (no se quiere cambiar)
        }
        
        const sucursal = await tx.sucursal.update({
          where: { id: data.id }, // Usar data.id para el where
          data: sucursalUpdateData,
        });
        return sucursal;
      });
      return updatedSucursal;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error("Error de validación: " + error.errors.map(e => e.message).join(", "));
      }
      console.error(`Error al actualizar sucursal con ID ${data.id} en SucursalService:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002' && error.meta?.target === 'sucursales_direccionId_key') {
          throw new Error("La dirección ya está asociada a otra sucursal. Una dirección solo puede tener una sucursal.");
        }
      }
      throw new Error("Error al actualizar la sucursal. Detalles: " + (error as Error).message);
    }
  }

  /**
   * Elimina una sucursal.
   * Antes de eliminar, verifica si existen ubicaciones o tickets asociados.
   * Si existen, la eliminación es restringida para mantener la integridad.
   * Si no tiene dependencias, también elimina su dirección asociada.
   * @param id El ID de la sucursal a eliminar.
   * @returns Un objeto de éxito o error.
   */
  static async deleteSucursal(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Verificar si la sucursal tiene ubicaciones asociadas (onDelete: Restrict en Ubicacion)
        const ubicacionesCount = await tx.ubicacion.count({
          where: { sucursalId: id },
        });

        if (ubicacionesCount > 0) {
          throw new Error("No se puede eliminar la sucursal porque tiene ubicaciones asociadas. Primero, desvincula o elimina sus ubicaciones.");
        }

        // 2. Verificar si la sucursal tiene tickets asociados (onDelete: SET NULL en Ticket)
        const ticketsCount = await tx.ticket.count({
          where: { sucursalId: id },
        });

        if (ticketsCount > 0) {
          // Si hay tickets, se reasignarán a null automáticamente.
          // Aquí podríamos añadir una lógica de negocio para reasignar a una sucursal "genérica"
          // o pedir confirmación para desvincularlos.
          // Por ahora, lanzamos un error que indica que tiene tickets.
          throw new Error("No se puede eliminar la sucursal porque tiene tickets asociados. Por favor, reasigna o cierra los tickets de esta sucursal primero.");
        }

        // Obtener la sucursal para obtener su direccionId antes de eliminarla
        const sucursalToDelete = await tx.sucursal.findUnique({
          where: { id },
          select: { direccionId: true }
        });

        if (!sucursalToDelete) {
          throw new Error("Sucursal no encontrada para eliminar.");
        }

        // 3. Eliminar la sucursal
        await tx.sucursal.delete({
          where: { id },
        });

        // 4. Eliminar la dirección asociada si no está siendo usada por otras entidades (ej. Empresa)
        // Esto es importante para limpiar direcciones "huérfanas"
        const isDireccionUsedByOtherSucursal = await tx.sucursal.count({
          where: {
            direccionId: sucursalToDelete.direccionId,
            NOT: { id }, // Excluir la sucursal que acabamos de eliminar
          },
        });

        const isDireccionUsedByEmpresa = await tx.empresa.count({
          where: { direccionPrincipalId: sucursalToDelete.direccionId },
        });

        if (isDireccionUsedByOtherSucursal === 0 && isDireccionUsedByEmpresa === 0) {
          await tx.direccion.delete({
            where: { id: sucursalToDelete.direccionId },
          });
        }
      });
      return { success: true, message: "Sucursal eliminada exitosamente." };
    } catch (error: any) {
      console.error(`Error al eliminar sucursal con ID ${id} en SucursalService:`, error);
      return { success: false, message: error.message || "Error al eliminar la sucursal." };
    }
  }
}
