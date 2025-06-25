// RUTA: src/services/ticketService.ts

import { prisma } from "@/lib/prisma";
import { Prisma, Ticket, AccionTicket, EstadoTicket, TipoAccion } from "@prisma/client";
import { createAccionTicketSchema, updateAccionTicketSchema, createTicketSchema, updateTicketSchema } from "@/lib/validators/ticketValidator";
import { z } from "zod";

export type TicketCreateInput = z.infer<typeof createTicketSchema>;
export type TicketUpdateInput = z.infer<typeof updateTicketSchema>;
export type AccionTicketCreateInput = z.infer<typeof createAccionTicketSchema>;
export type AccionTicketUpdateInput = z.infer<typeof updateAccionTicketSchema>;

export class TicketService {

  // --- MÉTODOS DE TICKETS (EXISTENTES) ---
  static async getTickets(includeRelations = true) {
    return prisma.ticket.findMany({ 
        include: { 
            empresa: includeRelations, 
            sucursal: includeRelations,
            tecnicoAsignado: includeRelations,
            contacto: includeRelations,
        },
        orderBy: { fechaCreacion: 'desc' }
    });
  }

  static async getTicketById(id: string) {
    return prisma.ticket.findUnique({ 
        where: { id }, 
        include: { 
            acciones: { include: { realizadaPor: true }, orderBy: { fechaAccion: 'desc' } }, 
            equiposEnPrestamo: true,
            empresa: true, 
            sucursal: true,
            tecnicoAsignado: true,
            contacto: true,
        } 
    });
  }

  static async createTicket(data: TicketCreateInput) {
    const validatedData = createTicketSchema.parse(data);
    return prisma.ticket.create({ data: validatedData as any });
  }

  static async updateTicket(data: TicketUpdateInput) {
    const { id, ...restOfData } = data;
    if (!id) throw new Error("Se requiere ID para actualizar el ticket.");
    const validatedData = updateTicketSchema.parse(restOfData);
    return prisma.ticket.update({ where: { id }, data: validatedData });
  }

  static async deleteTicket(id: string) {
    const prestamosCount = await prisma.equipoEnPrestamo.count({ where: { ticketId: id } });
    if (prestamosCount > 0) {
        throw new Error("No se puede eliminar el ticket porque tiene préstamos asociados");
    }
    await prisma.accionTicket.deleteMany({ where: { ticketId: id } });
    return prisma.ticket.delete({ where: { id } });
  }

  // --- MÉTODOS DE ACCIONES ---

  static async getAccionesByTicketId(ticketId: string) {
      return prisma.accionTicket.findMany({ where: { ticketId }, orderBy: { fechaAccion: 'desc' } });
  }
  
  static async addAccionToTicket(data: AccionTicketCreateInput): Promise<AccionTicket> {
    const validatedData = createAccionTicketSchema.parse(data);
    // CORRECCIÓN: Separamos usuarioId del resto para evitar el conflicto en Prisma.
    const { ticketId, nuevoEstado, usuarioId, ...accionData } = validatedData;

    return prisma.$transaction(async (tx) => {
      const ticketActual = await tx.ticket.findUnique({ where: { id: ticketId }, select: { estado: true }});
      if (!ticketActual) {
        throw new Error("El ticket no existe.");
      }

      if (nuevoEstado && ticketActual.estado !== nuevoEstado) {
        await tx.ticket.update({ where: { id: ticketId }, data: { estado: nuevoEstado }});
      }

      const accionCreada = await tx.accionTicket.create({
        data: {
          ...accionData, // Aquí ya no va usuarioId
          ticket: { connect: { id: ticketId } },
          realizadaPor: { connect: { id: usuarioId } },
          estadoTicketAnterior: ticketActual.estado,
          estadoTicketNuevo: nuevoEstado,
        }
      });

      return accionCreada;
    });
  }

  static async updateAccion(accionId: string, data: AccionTicketUpdateInput): Promise<AccionTicket> {
    const validatedData = updateAccionTicketSchema.parse(data);
    return prisma.accionTicket.update({
        where: { id: accionId },
        data: validatedData,
    });
  }

  static async deleteAccion(accionId: string): Promise<void> {
    await prisma.accionTicket.delete({ where: { id: accionId } });
  }
}