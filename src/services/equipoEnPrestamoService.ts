// src/services/equipoEnPrestamoService.ts

import { prisma } from "@/lib/prisma";
import { Prisma, EquipoEnPrestamo, EquipoInventario, ContactoEmpresa, Ticket, EstadoPrestamoEquipo, User, EstadoEquipoInventario } from "@prisma/client";
// Importamos los esquemas de validación Zod para EquipoEnPrestamo
import { createEquipoEnPrestamoSchema, updateEquipoEnPrestamoSchema } from "@/lib/validators/equipoEnPrestamoValidator";

/**
 * Define los tipos de entrada para las operaciones CRUD de EquipoEnPrestamo.
 */
export type EquipoEnPrestamoCreateInput = {
  equipoId: string;
  prestadoAContactoId: string;
  personaResponsableEnSitio: string;
  fechaDevolucionEstimada: Date;
  estadoPrestamo?: EstadoPrestamoEquipo;
  ticketId?: string | null;
  notasPrestamo?: string | null;
  entregadoPorUsuarioId?: string | null;
};

export type EquipoEnPrestamoUpdateInput = {
  id: string; // ID del registro de préstamo a actualizar
  equipoId?: string;
  prestadoAContactoId?: string;
  personaResponsableEnSitio?: string;
  fechaDevolucionEstimada?: Date;
  fechaDevolucionReal?: Date | null; // Para registrar la devolución
  estadoPrestamo?: EstadoPrestamoEquipo;
  ticketId?: string | null;
  notasPrestacion?: string | null;
  notasDevolucion?: string | null;
  entregadoPorUsuarioId?: string | null;
  recibidoPorUsuarioId?: string | null;
};

/**
 * Tipo para un EquipoEnPrestamo con sus relaciones más comunes.
 */
export type EquipoEnPrestamoWithRelations = EquipoEnPrestamo & {
  equipo?: EquipoInventario | null;
  prestadoAContacto?: ContactoEmpresa | null;
  ticketAsociado?: Ticket | null;
  entregadoPorUsuario?: User | null;
  recibidoPorUsuario?: User | null;
};

/**
 * Servicio para la gestión de Equipos en Préstamo.
 * Centraliza la lógica de negocio y el acceso a la base de datos para los préstamos.
 */
export class EquipoEnPrestamoService {

  /**
   * Obtiene todos los registros de equipos en préstamo, opcionalmente incluyendo sus relaciones.
   * @param includeRelations Indica si se deben incluir las relaciones.
   * @returns Un array de objetos EquipoEnPrestamo o EquipoEnPrestamoWithRelations.
   */
  static async getEquiposEnPrestamo(includeRelations: boolean = false): Promise<EquipoEnPrestamo[]> {
    try {
      const prestamos = await prisma.equipoEnPrestamo.findMany({
        include: includeRelations ? {
          equipo: true,
          prestadoAContacto: true,
          ticketAsociado: true,
          entregadoPorUsuario: true,
          recibidoPorUsuario: true,
        } : undefined,
        orderBy: { fechaPrestamo: 'desc' },
      });
      return prestamos;
    } catch (error) {
      console.error("Error al obtener equipos en préstamo en EquipoEnPrestamoService:", error);
      throw new Error("No se pudieron obtener los equipos en préstamo.");
    }
  }

  /**
   * Obtiene un registro de equipo en préstamo por su ID, incluyendo sus relaciones.
   * @param id El ID del registro de préstamo.
   * @returns El objeto EquipoEnPrestamoWithRelations o null si no se encuentra.
   */
  static async getEquipoEnPrestamoById(id: string): Promise<EquipoEnPrestamoWithRelations | null> {
    try {
      const prestamo = await prisma.equipoEnPrestamo.findUnique({
        where: { id },
        include: {
          equipo: true,
          prestadoAContacto: true,
          ticketAsociado: true,
          entregadoPorUsuario: true,
          recibidoPorUsuario: true,
        },
      });
      return prestamo;
    } catch (error) {
      console.error(`Error al obtener préstamo con ID ${id} en EquipoEnPrestamoService:`, error);
      throw new Error("No se pudo obtener el registro de préstamo.");
    }
  }

  /**
   * Crea un nuevo registro de equipo en préstamo, validando los datos con Zod.
   * También actualiza el estado del equipo en inventario.
   * @param data Los datos para crear el registro de préstamo.
   * @returns El objeto EquipoEnPrestamo creado.
   */
  static async createEquipoEnPrestamo(data: EquipoEnPrestamoCreateInput): Promise<EquipoEnPrestamo> {
    try {
      // Validar los datos de entrada con el esquema de creación de Zod
      const validatedData = createEquipoEnPrestamoSchema.parse(data);

      const newPrestamo = await prisma.$transaction(async (tx) => {
        // Conectar relaciones
        const equipoConnect = { connect: { id: validatedData.equipoId } };
        const prestadoAContactoConnect = { connect: { id: validatedData.prestadoAContactoId } };
        const ticketConnect = validatedData.ticketId ? { connect: { id: validatedData.ticketId } } : undefined;
        const entregadoPorConnect = validatedData.entregadoPorUsuarioId ? { connect: { id: validatedData.entregadoPorUsuarioId } } : undefined;

        const prestamo = await tx.equipoEnPrestamo.create({
          data: {
            equipo: equipoConnect,
            prestadoAContacto: prestadoAContactoConnect,
            personaResponsableEnSitio: validatedData.personaResponsableEnSitio,
            fechaPrestamo: new Date(), // Siempre se establece la fecha actual al crear
            fechaDevolucionEstimada: validatedData.fechaDevolucionEstimada,
            estadoPrestamo: validatedData.estadoPrestamo || EstadoPrestamoEquipo.PRESTADO,
            ticketAsociado: ticketConnect,
            notasPrestamo: validatedData.notasPrestamo,
            entregadoPorUsuario: entregadoPorConnect,
          },
        });

        // Actualizar el estado del equipo a "PRESTADO" en el inventario.
        // CORRECCIÓN: Usar EstadoEquipoInventario.PRESTADO (o el estado correcto para un equipo prestado).
        await tx.equipoInventario.update({
          where: { id: validatedData.equipoId },
          data: { estadoEquipo: EstadoEquipoInventario.PRESTADO }, 
        });

        return prestamo;
      });
      return newPrestamo;
    } catch (error) {
      console.error("Error al crear registro de préstamo en EquipoEnPrestamoService:", error);
      if (error instanceof Error && 'issues' in error) { // ZodError
        throw new Error("Error de validación al crear préstamo: " + (error as any).issues.map((i: any) => i.message).join(", "));
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Añadir manejo específico de errores de Prisma si es necesario
      }
      throw new Error("Error al crear el registro de préstamo. Detalles: " + (error as Error).message);
    }
  }

  /**
   * Actualiza un registro de equipo en préstamo existente, validando los datos con Zod.
   * Puede usarse para registrar la devolución o cambiar otros detalles.
   * También actualiza el estado del equipo en inventario si se registra la devolución.
   * @param data Los datos para actualizar el registro de préstamo (incluyendo el ID).
   * @returns El objeto EquipoEnPrestamo actualizado.
   */
  static async updateEquipoEnPrestamo(data: EquipoEnPrestamoUpdateInput): Promise<EquipoEnPrestamo> {
    try {
      // Validar los datos de entrada con el esquema de actualización de Zod
      const validatedData = updateEquipoEnPrestamoSchema.parse(data);

      const updatedPrestamo = await prisma.$transaction(async (tx) => {
        // Preparar datos de conexión/desconexión para relaciones opcionales
        const equipoUpdate = validatedData.equipoId ? { connect: { id: validatedData.equipoId } } : undefined;
        const prestadoAContactoUpdate = validatedData.prestadoAContactoId ? { connect: { id: validatedData.prestadoAContactoId } } : undefined;
        const ticketUpdate = validatedData.ticketId !== undefined
          ? (validatedData.ticketId === null ? { disconnect: true } : { connect: { id: validatedData.ticketId } })
          : undefined;
        const entregadoPorUpdate = validatedData.entregadoPorUsuarioId !== undefined
          ? (validatedData.entregadoPorUsuarioId === null ? { disconnect: true } : { connect: { id: validatedData.entregadoPorUsuarioId } })
          : undefined;
        const recibidoPorUpdate = validatedData.recibidoPorUsuarioId !== undefined
          ? (validatedData.recibidoPorUsuarioId === null ? { disconnect: true } : { connect: { id: validatedData.recibidoPorUsuarioId } })
          : undefined;

        const prestamo = await tx.equipoEnPrestamo.update({
          where: { id: validatedData.id },
          data: {
            equipo: equipoUpdate,
            prestadoAContacto: prestadoAContactoUpdate,
            personaResponsableEnSitio: validatedData.personaResponsableEnSitio,
            fechaDevolucionEstimada: validatedData.fechaDevolucionEstimada,
            fechaDevolucionReal: validatedData.fechaDevolucionReal,
            estadoPrestamo: validatedData.estadoPrestamo,
            ticketAsociado: ticketUpdate,
            notasPrestamo: validatedData.notasPrestamo,
            notasDevolucion: validatedData.notasDevolucion,
            entregadoPorUsuario: entregadoPorUpdate,
            recibidoPorUsuario: recibidoPorUpdate,
          },
        });

        // Lógica para actualizar el estado del equipo si se registra la devolución
        if (validatedData.fechaDevolucionReal && validatedData.estadoPrestamo === EstadoPrestamoEquipo.DEVUELTO) {
          const equipoPrestado = await tx.equipoEnPrestamo.findUnique({
            where: { id: validatedData.id },
            select: { equipoId: true }
          });
          if (equipoPrestado?.equipoId) {
            // CORRECCIÓN: Usar EstadoEquipoInventario.DISPONIBLE
            await tx.equipoInventario.update({
              where: { id: equipoPrestado.equipoId },
              data: { estadoEquipo: EstadoEquipoInventario.DISPONIBLE }, // Usar el enum correcto aquí
            });
          }
        }

        return prestamo;
      });
      return updatedPrestamo;
    } catch (error) {
      console.error(`Error al actualizar registro de préstamo con ID ${data.id} en EquipoEnPrestamoService:`, error);
      if (error instanceof Error && 'issues' in error) { // ZodError
        throw new Error("Error de validación al actualizar préstamo: " + (error as any).issues.map((i: any) => i.message).join(", "));
      }
      throw new Error("Error al actualizar el registro de préstamo. Detalles: " + (error as Error).message);
    }
  }

  /**
   * Elimina un registro de equipo en préstamo.
   * @param id El ID del registro de préstamo a eliminar.
   * @returns Un objeto de éxito o error.
   */
  static async deleteEquipoEnPrestamo(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      await prisma.$transaction(async (tx) => {
        // No hay dependencias directas en cascada con EquipoEnPrestamo,
        // pero podemos considerar lógica de negocio inversa (ej. si era el último préstamo, cambiar estado del equipo).
        // Por ahora, solo elimina el registro.
        await tx.equipoEnPrestamo.delete({
          where: { id },
        });
      });
      return { success: true, message: "Registro de préstamo eliminado exitosamente." };
    } catch (error: any) {
      console.error(`Error al eliminar registro de préstamo con ID ${id} en EquipoEnPrestamoService:`, error);
      return { success: false, message: error.message || "Error al eliminar el registro de préstamo." };
    }
  }
}
