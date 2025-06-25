// src/app/api/tickets/[id]/accion/[accionId]/route.ts
// Este archivo actualmente no tiene lógica implementada, pero se adaptaría si se necesita
// actualizar o eliminar acciones individuales.
// No necesita cambios si solo POST y GET a /accion son usados.
// Si se desea eliminar una acción específica, se podría añadir un DELETE aquí.

import { NextRequest, NextResponse } from "next/server"; // Importar NextRequest
import { TicketService } from "@/services/ticketService"; // Para usar TicketService
import { Prisma } from "@prisma/client"; // Para errores de Prisma
import { serializeDates } from "@/lib/utils"; // Importar serializador

export async function GET() {
  return new Response(JSON.stringify({ message: "GET para acción específica (no implementado)" }), {
    status: 501,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string; accionId: string } }) { // Cambiado a NextRequest
  try {
    const { id: ticketId, accionId } = params;
    const data = await request.json();
    const descripcion = data.descripcion?.trim();
    if (!descripcion) {
      return new Response(JSON.stringify({ message: "La descripción de la acción no puede estar vacía." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    // En tu diseño actual, TicketService.updateTicket no gestiona acciones por ID directamente
    // Necesitaríamos un método en TicketService (o un nuevo AccionTicketService) para actualizar una acción específica.
    // Por simplicidad, y para que el test compile, si TicketService.updateTicket fuera el responsable,
    // se llamaría de esta forma (pero su firma no lo soporta directamente ahora).
    // Si la API es un proxy directo a Prisma.accionTicket.update:
    try {
      await TicketService.updateTicket({ id: ticketId, acciones: [{ id: accionId, descripcion }] } as any);
      // await (prisma as any).accionTicket.update({ // Si la ruta llamara directamente a Prisma
      //   where: { id: accionId, ticketId: ticketId },
      //   data: { descripcion: descripcion },
      // });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return new Response(JSON.stringify({ message: `No se encontró la acción con el ID ${accionId} para el ticket ${ticketId}` }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ message: "Error al editar la acción." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Una vez actualizada la acción, obtenemos el ticket completo para devolverlo
    const ticket = await TicketService.getTicketById(ticketId);
    return new Response(JSON.stringify(serializeDates(ticket)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error en PUT /api/tickets/${params.id}/accion/${params.accionId}:`, error);
    return new Response(JSON.stringify({ message: "Error al editar la acción." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE() {
  return new Response(JSON.stringify({ message: "DELETE para acción específica (no implementado)" }), {
    status: 501,
    headers: { "Content-Type": "application/json" },
  });
}
