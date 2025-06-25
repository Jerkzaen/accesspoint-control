// src/app/api/tickets/[id]/accion/route.ts

import { NextRequest, NextResponse } from "next/server"; // Importar NextRequest
import { TicketService } from "@/services/ticketService";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next"; // Importar getServerSession
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Importar authOptions
import { serializeDates } from "@/lib/utils"; // Importar serializador

export async function POST(request: NextRequest, { params }: { params: { id: string } }) { // Cambiado a NextRequest
  try {
    const { id: ticketId } = params;
    const data = await request.json();
    // Validar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ message: "Usuario no autenticado." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Validar descripción
    if (!data.descripcion || !data.descripcion.trim()) {
      return new Response(JSON.stringify({ message: "La descripción de la acción es obligatoria." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const accionData = { ...data, ticketId };
    try {
      const newAccion = await TicketService.addAccionToTicket(accionData);
      return new Response(JSON.stringify({ message: "Acción agregada con éxito." }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        return new Response(JSON.stringify({ message: `No existe.` }), { // Mensaje del servicio
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ message: "Error al agregar la acción al ticket." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error(`Error en POST /api/tickets/${params.id}/accion:`, error);
    return new Response(JSON.stringify({ message: "Error al agregar la acción al ticket." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) { // Cambiado a NextRequest
  try {
    const { id: ticketId } = params;
    const acciones = await TicketService.getAccionesByTicketId(ticketId);
    // Serializar fechas como string en acciones y objetos anidados
    return new Response(JSON.stringify(serializeDates(acciones)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error en GET /api/tickets/${params.id}/accion:`, error);
    return new Response(JSON.stringify({ message: "Error interno del servidor al obtener acciones." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
