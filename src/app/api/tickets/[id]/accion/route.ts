// src/app/api/tickets/[id]/accion/route.ts

import { NextResponse } from "next/server";
import { TicketService } from "@/services/ticketService"; // Importar el nuevo servicio
import { Prisma } from "@prisma/client";

/**
 * POST handler para añadir una nueva acción a un ticket.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del ticket.
 * @returns Una respuesta JSON con la acción creada o un mensaje de error.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: ticketId } = params;
    const data = await request.json(); // Los datos de la acción
    
    // Asumimos que data incluye descripcion, usuarioId, categoria
    // y que ticketId se toma de los params de la ruta
    const accionData = { ...data, ticketId }; 

    const newAccion = await TicketService.addAccionToTicket(accionData);
    return NextResponse.json(newAccion, { status: 201 });
  } catch (error) {
    console.error(`Error en POST /api/tickets/${params.id}/accion:`, error);
    return NextResponse.json(
      { message: "Error al añadir acción al ticket", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * GET handler para obtener todas las acciones de un ticket específico.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del ticket.
 * @returns Una respuesta JSON con las acciones del ticket o un mensaje de error.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: ticketId } = params;
    const acciones = await TicketService.getAccionesByTicketId(ticketId);
    return NextResponse.json(acciones);
  } catch (error) {
    console.error(`Error en GET /api/tickets/${params.id}/accion:`, error);
    return NextResponse.json(
      { message: "Error al obtener acciones del ticket", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
