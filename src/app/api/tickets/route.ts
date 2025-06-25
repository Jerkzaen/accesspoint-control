// RUTA: src/app/api/tickets/route.ts

import { NextResponse } from "next/server";
import { TicketService, TicketCreateInput } from "@/services/ticketService";
import { Prisma } from "@prisma/client";
// 1. --- Simplificamos la importación ---
import { getServerSession } from "next-auth/next";

/**
 * GET handler para obtener todos los tickets.
 */
export async function GET(request: Request) {
  // 2. --- Simplificamos la llamada y añadimos la verificación de sesión ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const tickets = await TicketService.getTickets(true);
    // 3. --- Usamos NextResponse que serializa automáticamente ---
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
  // 2. --- Simplificamos la llamada y añadimos la verificación de sesión ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const data: TicketCreateInput = await request.json();
    const newTicket = await TicketService.createTicket(data);
    return NextResponse.json(newTicket, { status: 201 });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: "Error al crear ticket: El número de caso ya existe." }, { status: 409 });
    }
    if (error.message && error.message.includes('Faltan campos obligatorios')) {
      return NextResponse.json({ message: "Faltan campos obligatorios." }, { status: 400 });
    }
    return NextResponse.json({ message: "Error al crear ticket" }, { status: 500 });
  }
}
