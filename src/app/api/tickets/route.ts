// RUTA: src/app/api/tickets/route.ts (CON LA LLAMADA A SESSION ACTIVADA)

import { NextResponse } from "next/server";
import { TicketService } from "@/services/ticketService";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

/**
 * GET handler para obtener todos los tickets.
 */
export async function GET(request: Request) {
  // --- La llamada que nos daba el error, ahora la volvemos a activar ---
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const tickets = await TicketService.getTickets(true);
    return NextResponse.json(tickets, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

// ... la función POST se mantiene igual