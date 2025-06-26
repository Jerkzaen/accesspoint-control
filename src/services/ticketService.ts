// RUTA: src/services/ticketService.ts

import { prisma } from "@/lib/prisma";
import { Prisma, Ticket } from "@prisma/client";
import { createTicketSchema, updateTicketSchema } from "@/lib/validators/ticketValidator"; // Asegúrate que los imports son correctos
import { z } from "zod";

// --- TIPOS DE INPUT USANDO ZOD ---
export type TicketCreateInput = z.infer<typeof createTicketSchema>;
export type TicketUpdateInput = z.infer<typeof updateTicketSchema>;
// ... (tus otros tipos para AccionTicket, etc. se mantienen)

export class TicketService {

  // --- MÉTODOS EXISTENTES ---
  static async getTickets(/*...*/) { /* Tu código existente */ }
  static async getTicketById(/*...*/) { /* Tu código existente */ }
  // ... (etc.)

  /**
   * MÉTODO "EMPODERADO" PARA CREAR UN TICKET
   * Implementa la lógica de negocio para buscar o crear una sucursal dinámicamente.
   */
  static async createTicket(data: TicketCreateInput): Promise<Ticket> {
    const validatedData = createTicketSchema.parse(data);
    const { nuevaSucursal, ...ticketData } = validatedData;

    let sucursalIdFinal = ticketData.sucursalId;

    // Si no nos dieron un ID de sucursal, pero sí los datos para crear una nueva...
    if (!sucursalIdFinal && nuevaSucursal) {
        // Usamos una transacción para asegurar que todo se cree correctamente o nada se crea.
        const sucursalCreada = await prisma.$transaction(async (tx) => {
            // 1. Crear la nueva Dirección
            const nuevaDireccion = await tx.direccion.create({
                data: {
                    calle: nuevaSucursal.direccion.calle,
                    numero: nuevaSucursal.direccion.numero,
                    depto: nuevaSucursal.direccion.depto,
                    comuna: { connect: { id: nuevaSucursal.comunaId } },
                }
            });

            // 2. Crear la nueva Sucursal, asociándola a la nueva Dirección y a la Empresa del ticket
            const nuevaSucursalCreada = await tx.sucursal.create({
                data: {
                    nombre: nuevaSucursal.nombre,
                    direccion: { connect: { id: nuevaDireccion.id } },
                    // Asumimos que la nueva sucursal pertenece a la misma empresa del ticket
                    empresa: ticketData.empresaId ? { connect: { id: ticketData.empresaId } } : undefined,
                }
            });

            return nuevaSucursalCreada;
        });
        sucursalIdFinal = sucursalCreada.id;
    }
    
    if (!sucursalIdFinal) {
        throw new Error("No se pudo determinar la sucursal para el ticket.");
    }

    // Finalmente, creamos el ticket con el ID de sucursal correcto (ya sea el existente o el nuevo).
    const newTicket = await prisma.ticket.create({
      data: {
        ...ticketData,
        sucursal: { connect: { id: sucursalIdFinal } },
        // Aquí se conectan las otras relaciones como empresa, contacto, etc.
        empresa: ticketData.empresaId ? { connect: { id: ticketData.empresaId } } : undefined,
        contacto: ticketData.contactoId ? { connect: { id: ticketData.contactoId } } : undefined,
        tecnicoAsignado: ticketData.tecnicoAsignadoId ? { connect: { id: ticketData.tecnicoAsignadoId } } : undefined,
      } as any, // Se usa 'as any' para simplificar, idealmente el tipo sería más estricto.
    });

    return newTicket;
  }

  // --- RESTO DE TUS MÉTODOS (updateTicket, deleteTicket, métodos de acciones, etc.) ---
  static async updateTicket(/*...*/) { /* Tu código existente */ }
  static async deleteTicket(/*...*/) { /* Tu código existente */ }
  static async getAccionesByTicketId(/*...*/) { /* Tu código existente */ }
  static async addAccionToTicket(/*...*/) { /* Tu código existente */ }
  static async updateAccion(/*...*/) { /* Tu código existente */ }
  static async deleteAccion(/*...*/) { /* Tu código existente */ }
}