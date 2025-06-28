// RUTA: src/app/api/tickets/route.ts

import { NextResponse } from "next/server";
import { TicketService, TicketCreateInput } from "@/services/ticketService";
import { getServerSession } from "next-auth"; // Importamos desde 'next-auth'
import { authOptions } from "@/lib/auth";     // Importamos nuestra "receta"

export async function GET(request: Request) {
  // Le pasamos la receta directamente. Cero magia.
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

export async function POST(request: Request) {
  // Le pasamos la receta directamente. Cero magia.
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const completeData = { ...data, creadoPorUsuarioId: session.user.id };
    const newTicket = await TicketService.createTicket(completeData);
    return NextResponse.json(newTicket, { status: 201 });
  } catch (error) {
    // Tu manejo de errores...
    return NextResponse.json({ message: "Error al crear ticket" }, { status: 500 });
  }
}
