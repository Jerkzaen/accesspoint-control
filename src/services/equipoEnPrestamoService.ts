// src/services/equipoEnPrestamoService.ts

import { prisma } from "@/lib/prisma";
import { EquipoEnPrestamo, EstadoPrestamoEquipo, EstadoEquipoInventario, Prisma } from "@prisma/client";
import { ZodError, z } from "zod";

// Importar los tipos de input de la fase de validación (Módulo 6 - Fase 2)
import { 
  EquipoEnPrestamoCreateInput, 
  EquipoEnPrestamoUpdateInput,
  createEquipoEnPrestamoSchema,
  updateEquipoEnPrestamoSchema
} from "@/lib/validators/equipoEnPrestamoValidator";

// Definir tipos que incluyen las relaciones para métodos que usan include
export type EquipoEnPrestamoWithRelations = Prisma.EquipoEnPrestamoGetPayload<{
  include: {
    equipo: true;
    prestadoAContacto: true;
    ticketAsociado: true;
    entregadoPorUsuario: true;
    recibidoPorUsuario: true;
  };
}>;

// Sobrecarga para getEquiposEnPrestamo según includeRelations
export type EquipoEnPrestamoList<T extends boolean> = T extends true 
  ? EquipoEnPrestamoWithRelations[] 
  : EquipoEnPrestamo[];

// Re-exportar los tipos para que puedan ser usados por otros módulos
export type { EquipoEnPrestamoCreateInput, EquipoEnPrestamoUpdateInput };


export class EquipoEnPrestamoService {

  /**
   * Obtiene una lista de todos los registros de equipos en préstamo.
   * Opcionalmente incluye relaciones.
   */
  static async getEquiposEnPrestamo(): Promise<EquipoEnPrestamo[]>;
  static async getEquiposEnPrestamo(includeRelations: true): Promise<EquipoEnPrestamoWithRelations[]>;
  static async getEquiposEnPrestamo(includeRelations: false): Promise<EquipoEnPrestamo[]>;
  static async getEquiposEnPrestamo(includeRelations: boolean = false): Promise<EquipoEnPrestamo[] | EquipoEnPrestamoWithRelations[]> {
    try {
      return await prisma.equipoEnPrestamo.findMany({
        include: includeRelations ? {
          equipo: true,
          prestadoAContacto: true,
          ticketAsociado: true,
          entregadoPorUsuario: true,
          recibidoPorUsuario: true,
        } : undefined,
        orderBy: { fechaPrestamo: 'desc' }, // Ordenar por fecha de préstamo más reciente
      }) as any;
    } catch (error: any) {
      console.error("Error al obtener registros de préstamo:", error);
      throw new Error(`No se pudieron obtener los equipos en préstamo. Detalles: ${error.message}`);
    }
  }

  /**
   * Obtiene un registro de equipo en préstamo por su ID.
   * Incluye todas las relaciones relevantes.
   */
  static async getEquipoEnPrestamoById(id: string): Promise<EquipoEnPrestamoWithRelations | null> {
    try {
      return await prisma.equipoEnPrestamo.findUnique({
        where: { id },
        include: {
          equipo: true,
          prestadoAContacto: true,
          ticketAsociado: true,
          entregadoPorUsuario: true,
          recibidoPorUsuario: true,
        },
      });
    } catch (error: any) {
      console.error(`Error al obtener registro de préstamo por ID ${id}:`, error);
      throw new Error(`No se pudo obtener el registro de préstamo. Detalles: ${error.message}`);
    }
  }

  /**
   * Crea un nuevo registro de préstamo de equipo.
   * Actualiza el estado del EquipoInventario a PRESTADO.
   */
  static async createEquipoEnPrestamo(data: EquipoEnPrestamoCreateInput): Promise<EquipoEnPrestamo> {
    try {
      // Validar los datos de entrada con Zod
      const validatedData = createEquipoEnPrestamoSchema.parse(data);

      return await prisma.$transaction(async (tx) => {
        // 1. Crear el registro de préstamo
        const nuevoPrestamo = await tx.equipoEnPrestamo.create({
          data: {
            equipo: { connect: { id: validatedData.equipoId } },
            prestadoAContacto: { connect: { id: validatedData.prestadoAContactoId } },
            personaResponsableEnSitio: validatedData.personaResponsableEnSitio,
            fechaDevolucionEstimada: validatedData.fechaDevolucionEstimada,
            estadoPrestamo: EstadoPrestamoEquipo.PRESTADO, // Estado inicial siempre PRESTADO
            notasPrestamo: validatedData.notasPrestamo,
            ...(validatedData.ticketId && { ticketAsociado: { connect: { id: validatedData.ticketId } } }),
            ...(validatedData.entregadoPorUsuarioId && { entregadoPorUsuario: { connect: { id: validatedData.entregadoPorUsuarioId } } }),
          },
        });

        // 2. Actualizar el estado del EquipoInventario a PRESTADO
        await tx.equipoInventario.update({
          where: { id: validatedData.equipoId },
          data: { estadoEquipo: EstadoEquipoInventario.PRESTADO },
        });

        return nuevoPrestamo;
      });
    } catch (error: any) {
      console.error("Error al crear registro de préstamo:", error);
      if (error instanceof ZodError) {
        throw new Error("Error de validación al crear préstamo: " + error.errors.map(e => e.message).join(", "));
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') { // Relación no encontrada (equipo, contacto, ticket, usuario)
          throw new Error('No se encontró el equipo, contacto, ticket o usuario asociado.');
        }
      }
      throw new Error(`Error al crear el registro de préstamo. Detalles: ${error.message}`);
    }
  }

  /**
   * Actualiza un registro de préstamo existente.
   * Maneja la devolución del equipo (cambio de estado a DEVUELTO y actualización de EquipoInventario).
   */
  static async updateEquipoEnPrestamo(id: string, data: EquipoEnPrestamoUpdateInput): Promise<EquipoEnPrestamo> {
    try {
      // Validar los datos de entrada con Zod
      const validatedData = updateEquipoEnPrestamoSchema.parse(data);

      return await prisma.$transaction(async (tx) => {
        const prestamoExistente = await tx.equipoEnPrestamo.findUnique({
          where: { id },
          select: { equipoId: true, estadoPrestamo: true }, // Necesitamos equipoId y estado actual
        });

        if (!prestamoExistente) {
          throw new Error('Registro de préstamo no encontrado para actualizar.');
        }

        const updateInput: Prisma.EquipoEnPrestamoUpdateInput = {
          // Solo incluir propiedades si están definidas en validatedData
          ...(validatedData.personaResponsableEnSitio !== undefined && { personaResponsableEnSitio: validatedData.personaResponsableEnSitio }),
          ...(validatedData.fechaDevolucionEstimada !== undefined && { fechaDevolucionEstimada: validatedData.fechaDevolucionEstimada }),
          ...(validatedData.fechaDevolucionReal !== undefined && { fechaDevolucionReal: validatedData.fechaDevolucionReal }),
          ...(validatedData.estadoPrestamo !== undefined && { estadoPrestamo: validatedData.estadoPrestamo }),
          ...(validatedData.notasPrestamo !== undefined && { notasPrestamo: validatedData.notasPrestamo }),
          ...(validatedData.notasDevolucion !== undefined && { notasDevolucion: validatedData.notasDevolucion }),
        };

        // Manejar conexiones para relaciones requeridas y opcionales
        if (validatedData.equipoId !== undefined && validatedData.equipoId !== null) {
          updateInput.equipo = { connect: { id: validatedData.equipoId } };
        }
        if (validatedData.prestadoAContactoId !== undefined && validatedData.prestadoAContactoId !== null) {
          updateInput.prestadoAContacto = { connect: { id: validatedData.prestadoAContactoId } };
        }
        if (validatedData.ticketId !== undefined) {
          updateInput.ticketAsociado = validatedData.ticketId === null ? { disconnect: true } : { connect: { id: validatedData.ticketId } };
        }
        if (validatedData.entregadoPorUsuarioId !== undefined) {
          updateInput.entregadoPorUsuario = validatedData.entregadoPorUsuarioId === null ? { disconnect: true } : { connect: { id: validatedData.entregadoPorUsuarioId } };
        }
        if (validatedData.recibidoPorUsuarioId !== undefined) {
          updateInput.recibidoPorUsuario = validatedData.recibidoPorUsuarioId === null ? { disconnect: true } : { connect: { id: validatedData.recibidoPorUsuarioId } };
        }
        
        const updatedPrestamo = await tx.equipoEnPrestamo.update({
          where: { id },
          data: updateInput,
        });

        // Lógica para actualizar el estado del EquipoInventario si el préstamo cambia a DEVUELTO
        if (updatedPrestamo.estadoPrestamo === EstadoPrestamoEquipo.DEVUELTO &&
            prestamoExistente.estadoPrestamo !== EstadoPrestamoEquipo.DEVUELTO) { // Solo si realmente cambió a DEVUELTO
          await tx.equipoInventario.update({
            where: { id: prestamoExistente.equipoId },
            data: { estadoEquipo: EstadoEquipoInventario.DISPONIBLE },
          });
        }

        return updatedPrestamo;
      });
    } catch (error: any) {
      console.error(`Error al actualizar registro de préstamo ${id}:`, error);
      if (error instanceof ZodError) {
        throw new Error("Error de validación al actualizar préstamo: " + error.errors.map(e => e.message).join(", "));
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') { // Record not found
          throw new Error('Registro de préstamo o entidad relacionada no encontrada para actualizar.');
        }
      }
      throw new Error(`No se pudo actualizar el registro de préstamo. Detalles: ${error.message}`);
    }
  }

  /**
   * Método para "finalizar" un préstamo si no se usa el estado DEVUELTO en update,
   * o para otras transiciones finales (ej. PERDIDO_POR_CLIENTE)
   * Nota: No se usa un "delete" físico, solo actualización de estado.
   */
  static async finalizarPrestamo(id: string, estadoFinal: EstadoPrestamoEquipo, notasDevolucion?: string): Promise<EquipoEnPrestamo> {
    if (estadoFinal !== EstadoPrestamoEquipo.DEVUELTO && estadoFinal !== EstadoPrestamoEquipo.PERDIDO_POR_CLIENTE) {
      throw new Error('Estado final inválido para finalizar préstamo. Use DEVUELTO o PERDIDO_POR_CLIENTE.');
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const prestamo = await tx.equipoEnPrestamo.findUnique({
          where: { id },
          select: { equipoId: true, estadoPrestamo: true },
        });

        if (!prestamo) {
          throw new Error('Registro de préstamo no encontrado para finalizar.');
        }

        if (prestamo.estadoPrestamo === EstadoPrestamoEquipo.DEVUELTO ||
            prestamo.estadoPrestamo === EstadoPrestamoEquipo.PERDIDO_POR_CLIENTE) {
          throw new Error('El préstamo ya ha sido finalizado.');
        }

        const updatedPrestamo = await tx.equipoEnPrestamo.update({
          where: { id },
          data: {
            estadoPrestamo: estadoFinal,
            fechaDevolucionReal: new Date(), // Registrar fecha de finalización
            notasDevolucion: notasDevolucion,
          },
        });

        // Si el equipo es devuelto o marcado como perdido, actualizar su estado en el inventario
        if (estadoFinal === EstadoPrestamoEquipo.DEVUELTO) {
          await tx.equipoInventario.update({
            where: { id: prestamo.equipoId },
            data: { estadoEquipo: EstadoEquipoInventario.DISPONIBLE },
          });
        } else if (estadoFinal === EstadoPrestamoEquipo.PERDIDO_POR_CLIENTE) {
          await tx.equipoInventario.update({
            where: { id: prestamo.equipoId },
            data: { estadoEquipo: EstadoEquipoInventario.PERDIDO_ROBADO }, // O DE_BAJA, según tu lógica
          });
        }

        return updatedPrestamo;
      });
    } catch (error: any) {
      console.error(`Error al finalizar préstamo ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new Error('Registro de préstamo no encontrado para finalizar.');
      }
      throw new Error(`No se pudo finalizar el préstamo. Detalles: ${error.message}`);
    }
  }

  /**
   * Elimina físicamente un registro de préstamo (solo para casos especiales)
   * Normalmente se debería usar finalizarPrestamo en su lugar
   */
  static async deleteEquipoEnPrestamo(id: string): Promise<void> {
    try {
      await prisma.equipoEnPrestamo.delete({
        where: { id },
      });
    } catch (error: any) {
      console.error(`Error al eliminar registro de préstamo ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new Error('Registro de préstamo no encontrado para eliminar.');
      }
      throw new Error(`Error al eliminar el registro de préstamo. Detalles: ${error.message}`);
    }
  }

  // NOTE: El método deleteEquipoEnPrestamo del archivo de test será reemplazado por la lógica de finalizarPrestamo.

}
