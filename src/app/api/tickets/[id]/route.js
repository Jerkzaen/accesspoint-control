// /app/api/tickets/[id]/route.js
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
    // Asegurarse de que el ticket devuelto tenga los nombres de campo actualizados
    // Prisma debería hacer esto automáticamente si el cliente está generado correctamente.
    return NextResponse.json(ticket);
  } catch (error) {
    console.error(`Error en GET /api/tickets/${params.id}:`, error);
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
    console.error(`Error en DELETE /api/tickets/${params.id}:`, error);
    // Prisma arroja P2025 si el registro a eliminar no se encuentra.
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: `No se encontró un ticket con el ID ${params.id} para eliminar.` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Error al eliminar el ticket", error: error.message },
      { status: 500 }
    );
  }
}

// Actualizar un ticket por ID
export async function PUT(request, { params }) {
  try {
    const dataFromFrontend = await request.json();

    // Campos que esperamos del frontend (basado en EditableTicketFields actualizado)
    // y que coinciden con nuestro modelo Prisma actualizado.
    const {
      tecnicoAsignado,
      prioridad,
      solicitante,
      estado,
      // Otros campos que podrías permitir editar en el futuro se añadirían aquí.
      // Por ahora, nos centramos en los de EditableTicketFields.
    } = dataFromFrontend;

    // Construir el objeto de datos para la actualización de Prisma.
    // Solo incluimos los campos que realmente queremos permitir que se actualicen
    // desde este endpoint y que vienen del frontend.
    const dataToUpdateInDb = {};

    if (tecnicoAsignado !== undefined) {
      dataToUpdateInDb.tecnicoAsignado = tecnicoAsignado;
    }
    if (prioridad !== undefined) {
      dataToUpdateInDb.prioridad = prioridad;
    }
    if (solicitante !== undefined) {
      dataToUpdateInDb.solicitante = solicitante;
    }
    if (estado !== undefined) {
      dataToUpdateInDb.estado = estado;
    }
    
    // El campo 'acciones' se maneja por un endpoint separado (/api/tickets/[id]/accion)
    // por lo que no lo incluimos aquí a menos que decidas cambiar esa lógica.
    // El campo 'fechaActualizacion' se actualiza automáticamente por @updatedAt.

    if (Object.keys(dataToUpdateInDb).length === 0) {
      return NextResponse.json(
        { message: "No se proporcionaron datos válidos para actualizar." },
        { status: 400 }
      );
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data: dataToUpdateInDb,
    });

    return NextResponse.json(updatedTicket); // Devuelve el ticket con los nombres de campo actualizados

  } catch (error) {
    console.error(`Error en PUT /api/tickets/${params.id}:`, error);
    // Prisma puede arrojar P2025 si el ticket a actualizar no existe.
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: `No se encontró un ticket con el ID ${params.id} para actualizar.` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Error al actualizar el ticket", error: error.message },
      { status: 500 } // Cambiado a 500 para errores más genéricos del servidor
    );
  }
}
