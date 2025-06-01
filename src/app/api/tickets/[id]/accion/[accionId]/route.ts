// api\tickets\[id]\accion\[accionId]
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Interfaz para la estructura de una acción individual, para mayor claridad.
// Es buena práctica tener tipos consistentes entre frontend y backend.
interface ActionEntry {
  id: string;
  fecha: string;
  descripcion: string;
}

// Tipos explícitos para request y params
export async function PUT(
  request: NextRequest, // Tipo para el objeto de la solicitud
  { params }: { params: { id: string, accionId: string } } // Tipo para los parámetros de la URL
) {
  try {
    const { id: ticketId, accionId } = params; // ID del ticket y el ID de la acción a editar
    const { descripcion: newDescripcion } = await request.json(); // La nueva descripción desde el cuerpo de la solicitud

    // Validar que la nueva descripción no esté vacía (o aplicar otras validaciones)
    if (typeof newDescripcion !== 'string' || newDescripcion.trim() === '') {
      return NextResponse.json(
        { message: "La descripción no puede estar vacía." },
        { status: 400 }
      );
    }

    // 1. Obtener el ticket actual
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { acciones: true }, // Solo necesitamos el campo acciones
    });

    if (!ticket) {
      return NextResponse.json(
        { message: `No se encontró un ticket con el ID ${ticketId}` },
        { status: 404 }
      );
    }

    // 2. Parsear el string JSON de acciones a un array
    let accionesArray: ActionEntry[] = [];
    try {
      const parsedActions = JSON.parse(ticket.acciones);
      if (Array.isArray(parsedActions)) {
        // Validar la estructura de cada acción parseada
        accionesArray = parsedActions.filter(
          (accion: any): accion is ActionEntry =>
            typeof accion === 'object' &&
            accion !== null &&
            typeof accion.id === 'string' &&
            typeof accion.fecha === 'string' &&
            typeof accion.descripcion === 'string' // La descripción puede ser vacía, pero debe existir
        );
      }
    } catch (e) {
      // Si el parseo falla o el campo acciones está vacío/malformado,
      // se considera que no hay acciones válidas para actualizar.
      // Dependiendo de la lógica de negocio, podrías querer manejar esto de otra forma.
      console.error("Error al parsear acciones existentes:", e);
      accionesArray = []; // Continuar con un array vacío si no se pueden parsear
    }

    // 3. Encontrar y actualizar la acción específica
    let actionFound = false;
    const updatedAccionesArray = accionesArray.map(accion => {
      if (accion.id === accionId) { // Comparamos por el ID de la acción
        actionFound = true;
        return { ...accion, descripcion: newDescripcion.trim() }; // Actualizamos la descripción
      }
      return accion;
    });

    if (!actionFound) {
      return NextResponse.json(
        { message: `No se encontró la acción con ID ${accionId} en el ticket ${ticketId}.` },
        { status: 404 }
      );
    }

    // 4. Convertir el array de vuelta a un string JSON y guardar
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        acciones: JSON.stringify(updatedAccionesArray),
      },
    });

    // 5. Devolver el ticket actualizado
    return NextResponse.json(updatedTicket);

  } catch (error: any) {
    console.error(`Error en PUT /api/tickets/${params.id}/accion/${params.accionId}:`, error);
    let errorMessage = "Error al editar acción";
    if (error instanceof SyntaxError) {
        errorMessage = "Error al parsear el JSON de la solicitud.";
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      { message: "Error interno del servidor al editar acción.", error: errorMessage },
      { status: 500 }
    );
  }
}
