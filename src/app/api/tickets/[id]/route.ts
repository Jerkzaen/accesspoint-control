// src/app/api/tickets/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"; // Importar NextRequest
import { TicketService } from "@/services/ticketService";
import { Prisma } from "@prisma/client";
import { TicketUpdateInput } from "@/services/ticketService"; // Importar el tipo de input para PUT
import { serializeDates } from "@/lib/utils"; // Importar serializador

/**
 * GET handler para obtener un ticket por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del ticket.
 * @returns Una respuesta JSON con el ticket o un mensaje de error.
 */
export async function GET(
  request: NextRequest, // Cambiado a NextRequest
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const ticket = await TicketService.getTicketById(id);
    if (!ticket) {
      return new Response(JSON.stringify({ message: "Ticket no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(serializeDates(ticket)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error en GET /api/tickets/${params.id}:`, error);
    return new Response(JSON.stringify({ message: "Error al obtener el ticket" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * PUT handler para actualizar un ticket por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del ticket.
 * @returns Una respuesta JSON con el ticket actualizado o un mensaje de error.
 */
export async function PUT(
  request: NextRequest, // Cambiado a NextRequest
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { id: _, ...restOfData }: TicketUpdateInput = await request.json();
    const updatedTicket = await TicketService.updateTicket({ id, ...restOfData });
    return new Response(JSON.stringify(serializeDates(updatedTicket)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(`Error en PUT /api/tickets/${params.id}:`, error);
    if (error.message && error.message.includes('Detalles:')) { // Mensajes que vienen del servicio
      return new Response(JSON.stringify({ message: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Puedes añadir más manejo específico de errores de Prisma o Zod aquí
    return new Response(JSON.stringify({ message: "Error al actualizar el ticket" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * DELETE handler para eliminar un ticket por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del ticket.
 * @returns Una respuesta JSON de éxito o un mensaje de error.
 */
export async function DELETE(
  request: NextRequest, // Cambiado a NextRequest
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await TicketService.deleteTicket(id);
    if (!result.success) { // El servicio devuelve {success: false} en algunos casos
      return new Response(JSON.stringify({ message: result.message || "Error al eliminar ticket" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ message: "Ticket eliminado exitosamente" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(`Error en DELETE /api/tickets/${params.id}:`, error);
    if (error.message && error.message.includes("préstamos asociados")) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ message: "Error al eliminar ticket" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
