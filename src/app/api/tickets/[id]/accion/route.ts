// RUTA: src/app/api/tickets/[id]/accion/route.ts

import { NextRequest, NextResponse } from "next/server";
import { TicketService } from "@/services/ticketService";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";

/**
 * GET handler para obtener todas las acciones de un ticket específico.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const acciones = await TicketService.getAccionesByTicketId(params.id);
    return NextResponse.json(acciones, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error interno del servidor al obtener acciones." },
      { status: 500 }
    );
  }
}

/**
 * POST handler para crear una nueva acción en un ticket.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session || !session.user?.id) { // Verificación extra de session.user.id
    return NextResponse.json({ message: "Usuario no autenticado." }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    // El servicio necesita el ticketId y el usuario que realiza la acción
    const accionData = { 
        ...data, 
        ticketId: params.id, 
        usuarioId: session.user.id // Ahora es seguro acceder a session.user.id
    };

    const newAccion = await TicketService.addAccionToTicket(accionData);
    
    return NextResponse.json({ message: "Acción agregada con éxito.", accion: newAccion }, { status: 201 });

  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ message: `El ticket con ID ${params.id} no existe.` }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Error al agregar la acción al ticket." },
      { status: 500 }
    );
  }
}
