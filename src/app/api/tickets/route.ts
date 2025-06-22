// src/app/api/tickets/route.ts

import { NextRequest, NextResponse } from "next/server"; // Importar NextRequest
import { TicketService } from "@/services/ticketService";
import { Prisma } from "@prisma/client";
import { TicketCreateInput } from "@/services/ticketService"; // Importar el tipo de input para POST

/**
 * GET handler para obtener todos los tickets.
 * @param request La solicitud Next.js.
 * @returns Una respuesta JSON con los tickets o un mensaje de error.
 */
export async function GET(request: NextRequest) {
  try {
    const tickets = await TicketService.getTickets(true); // Incluir relaciones comunes
    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error en GET /api/tickets:", error);
    return NextResponse.json(
      { message: "Error al obtener tickets", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * POST handler para crear un nuevo ticket.
 * @param request La solicitud Next.js.
 * @returns Una respuesta JSON con el ticket creado o un mensaje de error.
 */
export async function POST(request: NextRequest) { // Tipado explícito para 'request'
  try {
    // Asegurarse de que el JSON que se recibe coincide con TicketCreateInput
    const data: TicketCreateInput = await request.json(); 
    const newTicket = await TicketService.createTicket(data);
    return NextResponse.json(newTicket, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/tickets:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { // Unique constraint failed on 'numeroCaso'
        return NextResponse.json(
          { message: "Error al crear ticket: El número de caso ya existe.", error: error.message },
          { status: 409 } // Conflict
        );
      }
    }
    return NextResponse.json(
      { message: "Error al crear ticket", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
