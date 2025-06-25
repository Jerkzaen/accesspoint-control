// RUTA: src/services/ticketService.ts

import { prisma } from "@/lib/prisma";
import {
  Prisma,
  Ticket,
  AccionTicket,
  // ...otros imports que ya tienes
} from "@prisma/client";
import { createAccionTicketSchema } from "@/lib/validators/accionTicketValidator";

// --- Tipos de Input (los que ya tenías) ---
export type TicketCreateInput = { /*...*/ };
export type TicketUpdateInput = { /*...*/ };
export type AccionTicketCreateInput = { /*...*/ };

// --- NUEVO TIPO DE INPUT ---
export type AccionTicketUpdateInput = {
  descripcion?: string;
  categoria?: string | null;
};


export class TicketService {
  // --- Todos los métodos que ya tenías (getTickets, createTicket, etc.) ---
  
  static async getTickets(/*...*/) { /* Tu código existente */ }
  static async getTicketById(/*...*/) { /* Tu código existente */ }
  static async createTicket(/*...*/) { /* Tu código existente */ }
  static async updateTicket(/*...*/) { /* Tu código existente */ }
  static async deleteTicket(/*...*/) { /* Tu código existente */ }
  static async addAccionToTicket(/*...*/) { /* Tu código existente */ }
  static async getAccionesByTicketId(/*...*/) { /* Tu código existente */ }

  // --- NUEVOS MÉTODOS AÑADIDOS ---

  /**
   * Actualiza una acción específica de un ticket.
   * @param accionId El ID de la acción a actualizar.
   * @param data Los datos para actualizar la acción.
   * @returns La acción actualizada.
   */
  static async updateAccion(
    accionId: string,
    data: AccionTicketUpdateInput
  ): Promise<AccionTicket> {
    try {
      const updatedAccion = await prisma.accionTicket.update({
        where: { id: accionId },
        data: {
          descripcion: data.descripcion,
          categoria: data.categoria,
        },
      });
      return updatedAccion;
    } catch (error) {
      console.error(`Error al actualizar acción con ID ${accionId}:`, error);
      // Prisma lanza P2025 si el registro a actualizar no se encuentra.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new Error(`No se encontró la acción con ID ${accionId}.`);
      }
      throw new Error("Error al actualizar la acción.");
    }
  }

  /**
   * Elimina una acción específica de un ticket.
   * @param accionId El ID de la acción a eliminar.
   */
  static async deleteAccion(accionId: string): Promise<void> {
    try {
      await prisma.accionTicket.delete({
        where: { id: accionId },
      });
      // No se devuelve nada en caso de éxito.
    } catch (error) {
      console.error(`Error al eliminar acción con ID ${accionId}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new Error(`No se encontró la acción con ID ${accionId} para eliminar.`);
      }
      throw new Error("Error al eliminar la acción.");
    }
  }

  // ...resto de tus métodos existentes como importTicketsMassive, etc.
}
