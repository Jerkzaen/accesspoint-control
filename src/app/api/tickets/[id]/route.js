// /app/api/tickets/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Importar los enums de Prisma
import { EstadoTicket, PrioridadTicket } from "@prisma/client"; 

// Obtener un ticket por ID (no afectado por este error, pero se mantiene la importación del enum)
export async function GET(request, { params }) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: { // Asegurarse de incluir las relaciones si este endpoint se usa para mostrar detalles completos
        empresaCliente: { select: { id: true, nombre: true } },
        ubicacion: { select: { id: true, nombreReferencial: true, direccionCompleta: true } },
        tecnicoAsignado: { select: { id: true, name: true, email: true } },
        acciones: {
          orderBy: { fechaAccion: 'asc' },
          include: {
            realizadaPor: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!ticket) {
      return NextResponse.json(
        { message: `No se encontró un ticket con el ID ${params.id}` },
        { status: 404 }
      );
    }
    return NextResponse.json(ticket);
  } catch (error) {
    console.error(`Error en GET /api/tickets/${params.id}:`, error);
    // Manejo de error para 'unknown' type
    return NextResponse.json(
      { message: "Error al obtener el ticket", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

// Eliminar un ticket por ID (no afectado por este error)
export async function DELETE(request, { params }) {
  try {
    const deleted = await prisma.ticket.delete({
      where: { id: params.id },
    });
    return NextResponse.json(deleted);
  } catch (error) {
    console.error(`Error en DELETE /api/tickets/${params.id}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: `No se encontró un ticket con el ID ${params.id} para eliminar.` },
        { status: 404 }
      );
    }
    // Manejo de error para 'unknown' type
    return NextResponse.json(
      { message: "Error al eliminar el ticket", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

// Actualizar un ticket por ID
export async function PUT(request, { params }) {
  try {
    const dataFromFrontend = await request.json();

    const {
      tecnicoAsignado,
      prioridad,
      solicitante,
      estado, // Este es el campo que nos da problema
    } = dataFromFrontend;

    const dataToUpdateInDb = {};

    if (tecnicoAsignado !== undefined) {
      dataToUpdateInDb.tecnicoAsignado = tecnicoAsignado;
    }
    if (prioridad !== undefined) {
      // CORRECCIÓN: Usar el enum PrioridadTicket si la prioridad viene como string y necesita ser mapeada
      // Asegúrate de que el valor del frontend coincida con los valores del enum (ej. "MEDIA", "ALTA")
      if (Object.values(PrioridadTicket).includes(prioridad)) {
        dataToUpdateInDb.prioridad = prioridad;
      } else {
        console.warn(`Prioridad inválida recibida: ${prioridad}. Se ignorará la actualización de prioridad.`);
      }
    }
    if (solicitante !== undefined) {
      dataToUpdateInDb.solicitanteNombre = solicitante; // Asumiendo que 'solicitante' del frontend mapea a 'solicitanteNombre'
    }
    
    if (estado !== undefined) {
      // INICIO DE LA CORRECCIÓN: Convertir el string de estado a su valor de enum correspondiente
      // Asegúrate de que los strings del frontend coincidan con los nombres de los enums de Prisma
      switch (estado) {
        case "Abierto":
          dataToUpdateInDb.estado = EstadoTicket.ABIERTO;
          break;
        case "En Progreso":
          dataToUpdateInDb.estado = EstadoTicket.EN_PROGRESO;
          break;
        case "Cerrado":
          dataToUpdateInDb.estado = EstadoTicket.CERRADO;
          break;
        case "Pendiente":
          dataToUpdateInDb.estado = EstadoTicket.PENDIENTE;
          break;
        default:
          // Si el estado no coincide con ningún enum, puedes lanzar un error o ignorarlo
          console.warn(`Estado inválido recibido: ${estado}. Se ignorará la actualización de estado.`);
          break;
      }
      // FIN DE LA CORRECCIÓN
    }
    
    if (Object.keys(dataToUpdateInDb).length === 0) {
      return NextResponse.json(
        { message: "No se proporcionaron datos válidos para actualizar." },
        { status: 400 }
      );
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data: dataToUpdateInDb,
      include: { // Incluir las relaciones para que el frontend reciba el ticket completo
        empresaCliente: { select: { id: true, nombre: true } },
        ubicacion: { select: { id: true, nombreReferencial: true, direccionCompleta: true } },
        tecnicoAsignado: { select: { id: true, name: true, email: true } },
        acciones: {
          orderBy: { fechaAccion: 'asc' },
          include: {
            realizadaPor: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json(updatedTicket); 

  } catch (error) {
    console.error(`Error en PUT /api/tickets/${params.id}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: `No se encontró un ticket con el ID ${params.id} para actualizar.` },
        { status: 404 }
      );
    }
    // Manejo de error para 'unknown' type
    return NextResponse.json(
      { message: "Error al actualizar el ticket", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
