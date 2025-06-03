// src/app/api/tickets/route.js (ACTUALIZADO - CORRECCIÓN DE ERROR 'mode')
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Obtener todos los tickets con filtros opcionales
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchText = searchParams.get("searchText") || "";
    const estado = searchParams.get("estado") || "";
    const prioridad = searchParams.get("prioridad") || "";

    // Construir la cláusula `where` para la consulta de Prisma
    const whereClause = {};

    // Filtrar por estado si se proporciona
    if (estado) {
      whereClause.estado = estado;
    }

    // Filtrar por prioridad si se proporciona
    if (prioridad) {
      whereClause.prioridad = prioridad;
    }

    // Aplicar búsqueda de texto si se proporciona
    if (searchText) {
      // NOTA IMPORTANTE: Se ha eliminado `mode: 'insensitive'` porque solo es compatible
      // con bases de datos PostgreSQL. Si estás usando SQLite (por ejemplo),
      // esta opción causará un error. La búsqueda será sensible a mayúsculas y minúsculas
      // a menos que tu base de datos o configuración de Prisma maneje la insensibilidad
      // de otra manera (ej. configurando la base de datos o usando LOWER() si es posible).
      whereClause.OR = [
        { titulo: { contains: searchText } },
        { descripcionDetallada: { contains: searchText } },
        { empresa: { contains: searchText } },
        { solicitante: { contains: searchText } },
        { tecnicoAsignado: { contains: searchText } },
        // Convertir numeroCaso a string para buscar si es numérico
        { numeroCaso: { equals: parseInt(searchText) || undefined } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      orderBy: { numeroCaso: "desc" },
    });
    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error en GET /api/tickets:", error);
    return NextResponse.json(
      { message: "Error al obtener tickets", error: error.message },
      { status: 500 }
    );
  }
}

// Crear un ticket (sin cambios, ya que esto se maneja principalmente por Server Actions)
export async function POST(request) {
  try {
    const dataFromFrontend = await request.json();

    const dataToSave = {
      numeroCaso: dataFromFrontend.nroCaso,
      empresa: dataFromFrontend.empresa,
      tipoIncidente: dataFromFrontend.tipo,
      ubicacion: dataFromFrontend.ubicacion,
      tecnicoAsignado: dataFromFrontend.tecnico,
      solicitante: dataFromFrontend.contacto,
      titulo: dataFromFrontend.tituloDelTicket,
      descripcionDetallada: dataFromFrontend.detalleAdicional || null,
      prioridad: dataFromFrontend.prioridad,
      estado: dataFromFrontend.estado || "Abierto",
      acciones: Array.isArray(dataFromFrontend.acciones)
        ? JSON.stringify(dataFromFrontend.acciones)
        : dataFromFrontend.acciones || "[]",
      fechaCreacion: dataFromFrontend.createdAt ? new Date(dataFromFrontend.createdAt) : new Date(),
      fechaSolucion: dataFromFrontend.fechaSolucion ? new Date(dataFromFrontend.fechaSolucion) : null,
    };
    
    if (!dataToSave.numeroCaso || !dataToSave.empresa || !dataToSave.prioridad || !dataToSave.tecnicoAsignado || !dataToSave.tipoIncidente || !dataToSave.titulo || !dataToSave.ubicacion || !dataToSave.solicitante || !dataToSave.fechaCreacion) {
        return NextResponse.json(
            { message: "Faltan campos obligatorios para crear el ticket." },
            { status: 400 }
        );
    }

    const newTicket = await prisma.ticket.create({
      data: dataToSave,
    });
    return NextResponse.json(newTicket, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/tickets:", error);
    return NextResponse.json(
      { message: "Error al crear ticket", error: error.message },
      { status: 400 }
    );
  }
}
