// src/app/api/tickets/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Obtener todos los tickets
export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { nroCaso: "desc" },
    });
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json(
      { message: "Error al obtener tickets", error: error.message },
      { status: 500 }
    );
  }
}

// Crear un ticket
export async function POST(request) {
  try {
    const data = await request.json();
    // Asegúrate de que el objeto `data` tenga las propiedades necesarias:
    //   nroCaso, empresa, ubicacion, contacto, prioridad, tecnico, tipo, descripcion, etc.

    // === CAMBIO IMPORTANTE AQUÍ para el campo 'acciones' ===
    const accionesParaGuardar = Array.isArray(data.acciones)
      ? JSON.stringify(data.acciones)
      : data.acciones || "[]"; // Si no es array y no viene, se usa '[]' como string

    const newTicket = await prisma.ticket.create({
      data: {
        nroCaso: data.nroCaso,
        empresa: data.empresa,
        ubicacion: data.ubicacion,
        contacto: data.contacto,
        prioridad: data.prioridad,
        tecnico: data.tecnico,
        tipo: data.tipo,
        descripcion: data.descripcion,
        // Usamos la variable que asegura que 'acciones' sea un string JSON
        acciones: accionesParaGuardar,
        estado: data.estado ?? "Abierto",
        fechaSolucion: data.fechaSolucion ? new Date(data.fechaSolucion) : null,
      },
    });
    return NextResponse.json(newTicket);
  } catch (error) {
    return NextResponse.json(
      { message: "Error al crear ticket", error: error.message },
      { status: 400 }
    );
  }
}
