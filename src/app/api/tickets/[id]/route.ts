// src/app/api/tickets/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"; // Importar NextRequest
import { TicketService } from "@/services/ticketService";
import { Prisma } from "@prisma/client";
import { TicketUpdateInput } from "@/services/ticketService"; // Importar el tipo de input para PUT

/**
 * GET handler para obtener un ticket por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del ticket.
 * @returns Una respuesta JSON con el ticket o un mensaje de error.
 */
export async function GET(
  request: NextRequest, // Tipado explícito para 'request'
  { params }: { params: { id: string } } // Tipado explícito para 'params'
) {
  try {
    const { id } = params;
    const ticket = await TicketService.getTicketById(id);
    if (!ticket) {
      return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 });
    }
    return NextResponse.json(ticket);
  } catch (error) {
    console.error(`Error en GET /api/tickets/${params.id}:`, error);
    return NextResponse.json(
      { message: "Error al obtener ticket", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler para actualizar un ticket por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del ticket.
 * @returns Una respuesta JSON con el ticket actualizado o un mensaje de error.
 */
export async function PUT(
  request: NextRequest, // Tipado explícito para 'request'
  { params }: { params: { id: string } } // Tipado explícito para 'params'
) {
  try {
    const { id } = params;
    // Asegurarse de que el JSON que se recibe coincide con TicketUpdateInput
    // Omitimos el 'id' del cuerpo de la solicitud para evitar el error de duplicidad,
    // y usamos el 'id' de los parámetros de la URL.
    const { id: _, ...restOfData }: TicketUpdateInput = await request.json(); 
    const updatedTicket = await TicketService.updateTicket({ id, ...restOfData });
    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error(`Error en PUT /api/tickets/${params.id}:`, error);
    return NextResponse.json(
      { message: "Error al actualizar ticket", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler para eliminar un ticket por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del ticket.
 * @returns Una respuesta JSON de éxito o un mensaje de error.
 */
export async function DELETE(
  request: NextRequest, // Tipado explícito para 'request'
  { params }: { params: { id: string } } // Tipado explícito para 'params'
) {
  try {
    const { id } = params;
    const result = await TicketService.deleteTicket(id);
    if (!result.success) {
      return NextResponse.json({ message: result.message || "Error al eliminar ticket" }, { status: 400 });
    }
    return NextResponse.json({ message: result.message || "Ticket eliminado exitosamente" }, { status: 200 });
  } catch (error) {
    console.error(`Error en DELETE /api/tickets/${params.id}:`, error);
    return NextResponse.json(
      { message: "Error al eliminar ticket", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
