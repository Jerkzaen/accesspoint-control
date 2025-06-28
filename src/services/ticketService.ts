// RUTA: src/services/ticketService.ts
// VERSIÓN CON ACCIONES INMUTABLES: Se eliminaron los métodos updateAccion y deleteAccion.

import { prisma } from "@/lib/prisma";
import { Prisma, Ticket, AccionTicket, EstadoTicket, TipoAccion } from "@prisma/client";
import { createTicketSchema, updateTicketSchema, createAccionTicketSchema, updateAccionTicketSchema } from "@/lib/validators/ticketValidator";
import { z } from "zod";

// --- TIPOS DE INPUT ---
export type TicketCreateInput = z.infer<typeof createTicketSchema>;
export type TicketUpdateInput = z.infer<typeof updateTicketSchema>;
export type AccionTicketCreateInput = z.infer<typeof createAccionTicketSchema>;
export type AccionTicketUpdateInput = z.infer<typeof updateAccionTicketSchema>;

export class TicketService {

  // --- MÉTODOS DE TICKETS ---
  static async getTickets(includeRelations = true): Promise<Ticket[]> {
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

  static async getTicketById(id: string): Promise<Ticket | null> {
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

  static async createTicket(data: TicketCreateInput): Promise<Ticket> {
    const validatedData = createTicketSchema.parse(data);
    const { nuevaSucursal, sucursalId, creadoPorUsuarioId, empresaId, contactoId, tecnicoAsignadoId, ...ticketBasico } = validatedData;
    let sucursalIdFinal = sucursalId;

    if (!sucursalIdFinal && nuevaSucursal) {
        const sucursalCreada = await prisma.$transaction(async (tx) => {
            const nuevaDireccion = await tx.direccion.create({ data: { ...nuevaSucursal.direccion, comuna: { connect: { id: nuevaSucursal.comunaId } } } });
            const nuevaSucursalCreada = await tx.sucursal.create({ data: { nombre: nuevaSucursal.nombre, direccion: { connect: { id: nuevaDireccion.id } }, empresa: empresaId ? { connect: { id: empresaId } } : undefined } });
            return nuevaSucursalCreada;
        });
        sucursalIdFinal = sucursalCreada.id;
    }
    
    if (!sucursalIdFinal) { throw new Error("No se pudo determinar la sucursal para el ticket."); }

    const proximoNumeroCaso = (await prisma.ticket.count()) + 1;

    const datosCreacionTicket: Prisma.TicketCreateInput = {
        ...ticketBasico,
        numeroCaso: ticketBasico.numeroCaso || proximoNumeroCaso,
        creadoPorUsuario: { connect: { id: creadoPorUsuarioId } },
        sucursal: { connect: { id: sucursalIdFinal } },
        empresa: empresaId ? { connect: { id: empresaId } } : undefined,
        contacto: contactoId ? { connect: { id: contactoId } } : undefined,
        tecnicoAsignado: tecnicoAsignadoId ? { connect: { id: tecnicoAsignadoId } } : undefined,
    };

    return prisma.ticket.create({ data: datosCreacionTicket });
  }
  
  static async updateTicket(data: TicketUpdateInput): Promise<Ticket> {
    const { id, ...restOfData } = data;
    if (!id) throw new Error("Se requiere ID para actualizar el ticket.");
    const validatedData = updateTicketSchema.parse(restOfData);
    return prisma.ticket.update({ where: { id }, data: validatedData });
  }

  static async deleteTicket(id: string): Promise<Ticket> {
    const prestamosCount = await prisma.equipoEnPrestamo.count({ where: { ticketId: id } });
    if (prestamosCount > 0) {
        throw new Error("No se puede eliminar el ticket porque tiene préstamos asociados");
    }
    await prisma.accionTicket.deleteMany({ where: { ticketId: id } });
    return prisma.ticket.delete({ where: { id } });
  }

  // --- MÉTODOS DE ACCIONES ---
  static async getAccionesByTicketId(ticketId: string): Promise<AccionTicket[]> {
      return prisma.accionTicket.findMany({ where: { ticketId }, orderBy: { fechaAccion: 'desc' } });
  }
  
  static async addAccionToTicket(data: AccionTicketCreateInput): Promise<AccionTicket> {
    const validatedData = createAccionTicketSchema.parse(data);
    const { ticketId, nuevoEstado, usuarioId, ...accionData } = validatedData;

    return prisma.$transaction(async (tx) => {
      const ticketActual = await tx.ticket.findUnique({ where: { id: ticketId }, select: { estado: true }});
      if (!ticketActual) throw new Error("El ticket no existe.");
      if (nuevoEstado && ticketActual.estado !== nuevoEstado) {
        await tx.ticket.update({ where: { id: ticketId }, data: { estado: nuevoEstado }});
      }
      return tx.accionTicket.create({
        data: { 
            ...accionData, 
            ticket: { connect: { id: ticketId } }, 
            realizadaPor: { connect: { id: usuarioId } }, 
            estadoTicketAnterior: ticketActual.estado, 
            estadoTicketNuevo: nuevoEstado 
        }
      });
    });
  }

  // Los métodos updateAccion y deleteAccion han sido eliminados intencionalmente
  // para garantizar la inmutabilidad de la bitácora de acciones.
}
