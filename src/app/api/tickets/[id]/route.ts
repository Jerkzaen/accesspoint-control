// RUTA: src/app/api/tickets/[id]/route.ts

import { NextResponse } from "next/server";
import { TicketService, TicketUpdateInput } from "@/services/ticketService";
import { Prisma } from "@prisma/client";
// 1. --- IMPORTAMOS getServerSession ---
import { getServerSession } from "next-auth/next";

/**
 * GET handler para obtener un ticket por su ID.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const ticket = await TicketService.getTicketById(params.id);
    if (!ticket) {
      return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 });
    }
    // 3. --- SIMPLIFICAMOS LA RESPUESTA ---
    return NextResponse.json(ticket, { status: 200 });
  } catch (error) {
    console.error(`Error en GET /api/tickets/${params.id}:`, error);
    return NextResponse.json({ message: "Error al obtener el ticket" }, { status: 500 });
  }
}

/**
 * PUT handler para actualizar un ticket por su ID.
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    // La desestructuración para remover 'id' es una buena práctica
    const { id: _, ...restOfData }: TicketUpdateInput = await request.json();
    const updatedTicket = await TicketService.updateTicket({ id: params.id, ...restOfData });
    return NextResponse.json(updatedTicket, { status: 200 });
  } catch (error: any) {
    console.error(`Error en PUT /api/tickets/${params.id}:`, error);
    if (error.message && error.message.includes('Detalles:')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Error al actualizar el ticket" }, { status: 500 });
  }
}

/**
 * DELETE handler para eliminar un ticket por su ID.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    // El servicio maneja la lógica de si se puede eliminar o no
    await TicketService.deleteTicket(params.id);
    return NextResponse.json({ message: "Ticket eliminado exitosamente" }, { status: 200 });
  } catch (error: any) {
    console.error(`Error en DELETE /api/tickets/${params.id}:`, error);
    if (error.message && error.message.includes("préstamos asociados")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Error al eliminar ticket" }, { status: 500 });
  }
}
