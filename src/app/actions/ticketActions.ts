"use server";

import { TicketService, TicketCreateInput, TicketUpdateInput, TicketWithRelations, AccionTicketCreateInput } from "@/services/ticketService";
import { revalidatePath } from "next/cache";
import type { AccionTicket, EquipoEnPrestamo, EquipoInventario } from "@prisma/client";

/**
 * Obtiene todos los tickets.
 * @returns Un objeto con el resultado de la operación (éxito/error) y los datos de los tickets.
 */
export async function getTicketsAction(): Promise<{ success: boolean; data?: TicketWithRelations[]; error?: string; }> {
  try {
    const tickets = await TicketService.getTickets(true); // Incluimos relaciones
    return { success: true, data: tickets };
  } catch (error: any) {
    console.error("Error en getTicketsAction:", error);
    return { success: false, error: error.message || "Error desconocido al obtener tickets." };
  }
}

/**
 * Obtiene un ticket por su ID.
 * @param id El ID del ticket.
 * @returns Un objeto con el resultado de la operación y los datos del ticket.
 */
export async function getTicketByIdAction(id: string): Promise<{ success: boolean; data?: TicketWithRelations | null; error?: string; }> {
  try {
    const ticket = await TicketService.getTicketById(id);
    return { success: true, data: ticket };
  } catch (error: any) {
    console.error(`Error en getTicketByIdAction para ID ${id}:`, error);
    return { success: false, error: error.message || "Error desconocido al obtener el ticket." };
  }
}

/**
 * Crea un nuevo ticket.
 * @param data Los datos de la nueva ticket.
 * @returns Un objeto con el resultado de la operación (éxito/error) y los datos del ticket creado.
 */
export async function createTicketAction(data: TicketCreateInput): Promise<{ success: boolean; data?: TicketWithRelations; error?: string; }> {
  try {
    const newTicket = await TicketService.createTicket(data);
    revalidatePath("/tickets/dashboard"); // Revalida la ruta para mostrar los cambios
    return { success: true, data: newTicket };
  } catch (error: any) {
    console.error("Error en createTicketAction:", error);
    return { success: false, error: error.message || "Error desconocido al crear el ticket." };
  }
}

/**
 * Actualiza un ticket existente.
 * @param data Los datos a actualizar (parciales), incluyendo el ID del ticket.
 * @returns Un objeto con el resultado de la operación (éxito/error) y los datos del ticket actualizado.
 */
export async function updateTicketAction(data: TicketUpdateInput): Promise<{ success: boolean; data?: TicketWithRelations; error?: string; }> {
  try {
    const updatedTicket = await TicketService.updateTicket(data);
    revalidatePath("/tickets/dashboard"); // Revalida la ruta
    revalidatePath(`/tickets/dashboard/${data.id}`); // Si hay una página de detalle de ticket
    return { success: true, data: updatedTicket };
  } catch (error: any) {
    console.error(`Error en updateTicketAction para ID ${data.id}:`, error);
    return { success: false, error: error.message || "Error desconocido al actualizar el ticket." };
  }
}

/**
 * Elimina un ticket.
 * @param id El ID del ticket a eliminar.
 * @returns Un objeto con el resultado de la operación (éxito/error).
 */
export async function deleteTicketAction(id: string): Promise<{ success: boolean; message?: string; error?: string; }> {
  try {
    const result = await TicketService.deleteTicket(id);
    if (result.success) {
      revalidatePath("/tickets/dashboard");
      return { success: true, message: result.message };
    } else {
      return { success: false, error: result.message };
    }
  } catch (error: any) {
    console.error(`Error en deleteTicketAction para ID ${id}:`, error);
    return { success: false, error: error.message || "Error desconocido al eliminar el ticket." };
  }
}

/**
 * Añade una acción a un ticket.
 * @param data Los datos de la acción a añadir.
 * @returns Un objeto con el resultado de la operación y la acción creada.
 */
export async function addAccionToTicketAction(data: AccionTicketCreateInput): Promise<{ success: boolean; data?: AccionTicket; error?: string; }> {
  try {
    const newAccion = await TicketService.addAccionToTicket(data);
    revalidatePath(`/tickets/dashboard/${data.ticketId}`); // Revalida la página del ticket
    return { success: true, data: newAccion };
  } catch (error: any) {
    console.error("Error en addAccionToTicketAction:", error);
    return { success: false, error: error.message || "Error al añadir acción al ticket." };
  }
}

/**
 * Obtiene los equipos de inventario.
 * @returns Un array de objetos EquipoInventario.
 */
export async function getEquiposInventarioAction(): Promise<{ success: boolean; data?: EquipoInventario[]; error?: string; }> {
  try {
    const equipos = await TicketService.getEquiposInventario();
    return { success: true, data: equipos };
  } catch (error: any) {
    console.error("Error en getEquiposInventarioAction:", error);
    return { success: false, error: error.message || "Error al obtener equipos de inventario." };
  }
}

/**
 * Obtiene los equipos en préstamo.
 * @returns Un array de objetos EquipoEnPrestamo.
 */
export async function getEquiposEnPrestamoAction(): Promise<{ success: boolean; data?: EquipoEnPrestamo[]; error?: string; }> {
  try {
    const prestamos = await TicketService.getEquiposEnPrestamo();
    return { success: true, data: prestamos };
  } catch (error: any) {
    console.error("Error en getEquiposEnPrestamoAction:", error);
    return { success: false, error: error.message || "Error al obtener equipos en préstamo." };
  }
}

