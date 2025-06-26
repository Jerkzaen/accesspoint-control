// RUTA: src/app/api/tickets/route.ts (LA CORRECCIÓN FINAL)

import { NextResponse } from "next/server";
import { TicketService } from "@/services/ticketService";
import { Prisma } from "@prisma/client";
// 1. --- IMPORTAMOS authOptions Y CAMBIAMOS LA RUTA DE getServerSession ---
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

/**
 * GET handler para obtener todos los tickets.
 */
export async function GET(request: Request) {
  // 2. --- LE PASAMOS LA RECETA DIRECTAMENTE ---
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const tickets = await TicketService.getTickets(true);
    return NextResponse.json(tickets, { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/tickets:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * POST handler para crear un nuevo ticket.
 */
export async function POST(request: Request) {
  // 2. --- LE PASAMOS LA RECETA DIRECTAMENTE ---
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const newTicket = await TicketService.createTicket(data);
    return NextResponse.json(newTicket, { status: 201 });
  } catch (error: any) {
    // Aquí va tu manejo de errores, que ya estaba bien
    if (error.name === 'ZodError') {
        return NextResponse.json({ message: "Datos de entrada inválidos.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Error al crear ticket" }, { status: 500 });
  }
}