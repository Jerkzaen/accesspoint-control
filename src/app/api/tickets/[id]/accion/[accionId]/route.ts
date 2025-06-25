// RUTA: src/app/api/tickets/[id]/accion/[accionId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { TicketService } from "@/services/ticketService";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";

export async function PUT(
  request: NextRequest,
  { params }: { params: { accionId: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const updatedAccion = await TicketService.updateAccion(params.accionId, data);
    return NextResponse.json(updatedAccion, { status: 200 });
  } catch (error: any) {
    if (error.message.includes('No se encontró la acción')) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    return NextResponse.json({ message: "Error al actualizar la acción." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { accionId: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    await TicketService.deleteAccion(params.accionId);
    return NextResponse.json({ message: "Acción eliminada exitosamente." }, { status: 200 });
  } catch (error: any) {
    if (error.message.includes('No se encontró la acción')) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    return NextResponse.json({ message: "Error al eliminar la acción." }, { status: 500 });
  }
}
