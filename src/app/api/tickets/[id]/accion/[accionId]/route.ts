// RUTA: src/app/api/tickets/[id]/accion/[accionId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { TicketService } from "@/services/ticketService";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";

/**
 * PUT handler para actualizar una acción específica de un ticket.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { accionId: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const { descripcion } = await request.json();
    if (!descripcion || !descripcion.trim()) {
      return NextResponse.json({ message: "La descripción es obligatoria." }, { status: 400 });
    }
    
    const updatedAccion = await TicketService.updateAccion(params.accionId, { descripcion });
    return NextResponse.json(updatedAccion, { status: 200 });

  } catch (error: any) {
    console.error(`Error en PUT /api/tickets/[id]/accion/${params.accionId}:`, error);
    if (error.message.includes('No se encontró la acción')) {
        return NextResponse.json({ message: error.message }, { status: 404 });
    }
    return NextResponse.json({ message: "Error al actualizar la acción." }, { status: 500 });
  }
}

/**
 * DELETE handler para eliminar una acción específica de un ticket.
 */
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
      console.error(`Error en DELETE /api/tickets/[id]/accion/${params.accionId}:`, error);
      if (error.message.includes('No se encontró la acción')) {
          return NextResponse.json({ message: error.message }, { status: 404 });
      }
      return NextResponse.json({ message: "Error al eliminar la acción." }, { status: 500 });
  }
}
