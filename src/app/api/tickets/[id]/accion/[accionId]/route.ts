// src/app/api/tickets/[id]/accion/[accionId]/route.ts (CORREGIDO)
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest, // Tipo para el objeto de la solicitud
  { params }: { params: { id: string, accionId: string } } // Tipo para los parámetros de la URL
) {
  try {
    const { id: ticketId, accionId } = params; // ID del ticket y el ID de la acción a editar
    const { descripcion: newDescripcion } = await request.json(); // La nueva descripción desde el cuerpo de la solicitud

    // Validar que la nueva descripción no esté vacía
    if (typeof newDescripcion !== 'string' || newDescripcion.trim() === '') {
      return NextResponse.json(
        { message: "La descripción de la acción no puede estar vacía." },
        { status: 400 }
      );
    }

    // Actualizar directamente la AccionTicket por su ID
    const updatedAccion = await prisma.accionTicket.update({
      where: {
        id: accionId,
        ticketId: ticketId, // Aseguramos que la acción pertenezca a este ticket
      },
      data: {
        descripcion: newDescripcion.trim(),
      },
      include: {
        realizadaPor: { // Incluir el usuario que realizó la acción para devolverlo en la respuesta
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Después de actualizar la acción, obtenemos el ticket completo y actualizado
    // con todas sus acciones (incluyendo la acción recién editada) y sus relaciones.
    const ticketActualizado = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        acciones: {
          orderBy: { fechaAccion: 'asc' }, // Asegura el orden correcto
          include: {
            realizadaPor: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        empresaCliente: { select: { id: true, nombre: true } },
        ubicacion: { select: { id: true, nombreReferencial: true, direccionCompleta: true } },
        tecnicoAsignado: { select: { id: true, name: true, email: true } },
      },
    });

    if (!ticketActualizado) {
      // Esto solo debería ocurrir si el ticket fue eliminado justo después de encontrar la acción
      return NextResponse.json(
        { message: `Ticket con ID ${ticketId} no encontrado después de actualizar la acción.` },
        { status: 404 }
      );
    }
    
    // Devolver el ticket completo y actualizado
    return NextResponse.json(ticketActualizado);

  } catch (error: any) {
    console.error(`Error en PUT /api/tickets/${params.id}/accion/${params.accionId}:`, error);
    let errorMessage = "Error interno del servidor al editar la acción.";
    if (error.code === 'P2025') { // Prisma error code for record not found
      errorMessage = `No se encontró la acción con ID ${params.accionId} en el ticket ${params.id}.`;
      return NextResponse.json(
        { message: errorMessage, error: error.message },
        { status: 404 }
      );
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { message: "Error al editar la acción.", error: errorMessage },
      { status: 500 }
    );
  }
}
