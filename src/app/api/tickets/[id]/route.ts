// RUTA: src/app/api/tickets/[id]/route.ts

import { NextResponse } from "next/server";
import { TicketService } from "@/services/ticketService";
import { getServerSession } from "next-auth"; // Importamos desde 'next-auth'
import { authOptions } from "@/lib/auth";     // Importamos nuestra "receta"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Le pasamos la receta directamente. Cero magia.
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const ticket = await TicketService.getTicketById(params.id);
    if (!ticket) {
      return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 });
    }
    return NextResponse.json(ticket, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error al obtener el ticket" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Le pasamos la receta directamente.
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  
  // Tu lógica para actualizar...
  try {
    const data = await request.json();
    const updatedTicket = await TicketService.updateTicket({ ...data, id: params.id });
    return NextResponse.json(updatedTicket, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error al actualizar ticket" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Le pasamos la receta directamente.
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    await TicketService.deleteTicket(params.id);
    return NextResponse.json({ message: "Ticket eliminado exitosamente" }, { status: 200 });
  } catch (error: any) {
    if (error.message.includes("préstamos asociados")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Error al eliminar ticket" }, { status: 500 });
  }
}
