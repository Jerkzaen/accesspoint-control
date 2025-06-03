// src/app/api/tickets/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Asegúrate que la ruta a prisma sea correcta

// Obtener todos los tickets
export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      // ACTUALIZADO: Usar el nuevo nombre de campo 'numeroCaso' para ordenar
      orderBy: { numeroCaso: "desc" },
    });
    return NextResponse.json(tickets);
  } catch (error) {
    // Loguear el error en el servidor para más detalles en Vercel o tu terminal local
    console.error("Error en GET /api/tickets:", error);
    return NextResponse.json(
      { message: "Error al obtener tickets", error: error.message },
      { status: 500 }
    );
  }
}

// Crear un ticket
// Asegúrate de que este también esté usando los nuevos nombres de campo
// si lo modificaste según nuestras conversaciones anteriores.
// El archivo ticketActions.ts ya maneja la creación con los nuevos nombres,
// por lo que este POST podría no estar siendo usado si toda la creación
// pasa por Server Actions. Si sí se usa, necesita la misma lógica de mapeo
// que aplicamos en ticketActions.ts.
export async function POST(request) {
  try {
    const dataFromFrontend = await request.json();

    // Asumiendo que el frontend envía datos con los nombres de input del formulario
    // y necesitamos mapearlos a los nombres del modelo Prisma.
    // Esta lógica debería ser similar a la de tu Server Action createNewTicketAction.

    // Ejemplo de mapeo (simplificado, ajusta según los campos que envíes):
    const dataToSave = {
      numeroCaso: dataFromFrontend.nroCaso,
      empresa: dataFromFrontend.empresa,
      tipoIncidente: dataFromFrontend.tipo,
      ubicacion: dataFromFrontend.ubicacion,
      tecnicoAsignado: dataFromFrontend.tecnico,
      solicitante: dataFromFrontend.contacto,
      titulo: dataFromFrontend.tituloDelTicket, // o dataFromFrontend.descripcion si así lo envías
      descripcionDetallada: dataFromFrontend.detalleAdicional || null,
      prioridad: dataFromFrontend.prioridad,
      estado: dataFromFrontend.estado || "Abierto",
      acciones: Array.isArray(dataFromFrontend.acciones)
        ? JSON.stringify(dataFromFrontend.acciones)
        : dataFromFrontend.acciones || "[]",
      fechaCreacion: dataFromFrontend.createdAt ? new Date(dataFromFrontend.createdAt) : new Date(),
      fechaSolucion: dataFromFrontend.fechaSolucion ? new Date(dataFromFrontend.fechaSolucion) : null,
      // fechaActualizacion es manejada por @updatedAt
    };
    
    // Validaciones básicas
    if (!dataToSave.numeroCaso || !dataToSave.empresa /* ...otros campos obligatorios... */) {
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
      { status: 400 } // Usualmente 400 para errores de datos de entrada, 500 para servidor
    );
  }
}
