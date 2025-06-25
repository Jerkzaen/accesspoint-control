// src/app/api/tickets/route.ts

import { NextRequest, NextResponse } from "next/server"; // Importar NextRequest
import { TicketService } from "@/services/ticketService";
import { Prisma } from "@prisma/client";
import { TicketCreateInput } from "@/services/ticketService";
import { serializeDates } from "@/lib/utils";
// Importar getServerSession y authOptions para la validación de sesión
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET handler para obtener todos los tickets.
 * @param request La solicitud Next.js.
 * @returns Una respuesta JSON con los tickets o un mensaje de error.
 */
export async function GET(request: NextRequest) { // Cambiado a NextRequest
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ message: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const tickets = await TicketService.getTickets(true); // Incluir relaciones comunes
    return new Response(JSON.stringify(serializeDates(tickets)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en GET /api/tickets:", error);
    return new Response(JSON.stringify({ message: "Error interno del servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * POST handler para crear un nuevo ticket.
 * @param request La solicitud Next.js.
 * @returns Una respuesta JSON con el ticket creado o un mensaje de error.
 */
export async function POST(request: NextRequest) { // Cambiado a NextRequest
  try {
    const data: TicketCreateInput = await request.json();
    // Validación mínima para simular error 400 si faltan campos obligatorios
    if (!data.titulo || !data.solicitanteNombre || !data.creadoPorUsuarioId) {
      return new Response(JSON.stringify({ message: "Faltan campos obligatorios." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Convertir fechaDevolucionEstimada a objeto Date si es un string (solo para equipoPrestamo anidado)
    if (data.equipoPrestamo && typeof data.equipoPrestamo.fechaDevolucionEstimada === 'string') {
      data.equipoPrestamo.fechaDevolucionEstimada = new Date(data.equipoPrestamo.fechaDevolucionEstimada);
    }
    const newTicket = await TicketService.createTicket(data);
    return new Response(JSON.stringify(serializeDates(newTicket)), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new Response(JSON.stringify({ message: "Error al crear ticket: El número de caso ya existe." }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (error.message && error.message.includes('Faltan campos obligatorios')) {
      return new Response(JSON.stringify({ message: "Faltan campos obligatorios." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ message: "Error al crear ticket" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

