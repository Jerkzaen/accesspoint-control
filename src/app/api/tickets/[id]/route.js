// /api/tickets/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Obtener un ticket por ID
export async function GET(request, { params }) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
    });
    if (!ticket) {
      return NextResponse.json(
        { message: `No se encontró un ticket con el ID ${params.id}` },
        { status: 404 }
      );
    }
    return NextResponse.json(ticket);
  } catch (error) {
    return NextResponse.json(
      { message: "Error al obtener el ticket", error: error.message },
      { status: 500 }
    );
  }
}

// Eliminar un ticket por ID
export async function DELETE(request, { params }) {
  try {
    const deleted = await prisma.ticket.delete({
      where: { id: params.id },
    });
    return NextResponse.json(deleted);
  } catch (error) {
    // Si no existe, prisma arrojará un error. Podrías personalizarlo:
    return NextResponse.json(
      { message: `No se encontró un ticket con el ID ${params.id}` },
      { status: 404 }
    );
  }
}

// Actualizar un ticket por ID
export async function PUT(request, { params }) {
  try {
const data = await request.json();

// Si 'acciones' puede ser actualizado y viene como array, convertir a string JSON
if (data.acciones !== undefined) {
  data.acciones = Array.isArray(data.acciones)
    ? JSON.stringify(data.acciones)
    : data.acciones; // Asegura que sea string si ya lo es
}

const updated = await prisma.ticket.update({
  where: { id: params.id },
  data: data, // Aquí 'data' ya tiene 'acciones' como string si era necesario
});
return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: "Error al actualizar el ticket", error: error.message },
      { status: 400 }
    );
  }
}