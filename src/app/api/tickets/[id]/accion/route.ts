//api\tickets\[id]\accion
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
// uuidv4 no se necesitará aquí si el frontend ya envía los IDs.
// import { v4 as uuidv4 } from 'uuid';

// Tipos para la estructura de una acción individual, si quieres ser más explícito
interface ActionPayloadEntry {
  id: string;
  fecha: string;
  descripcion: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Leer el cuerpo de la solicitud
    const body = await request.json();

    // 2. Extraer el array 'acciones' del cuerpo
    // El frontend envía un objeto como: { "acciones": [...] }
    const nuevasAccionesCompletas: ActionPayloadEntry[] | undefined = body.acciones;

    // 3. Validar que 'acciones' sea un array
    if (!Array.isArray(nuevasAccionesCompletas)) {
      return NextResponse.json(
        { message: "El campo 'acciones' es obligatorio y debe ser un array." },
        { status: 400 }
      );
    }

    // (Opcional pero recomendado) Aquí podrías añadir validación para cada objeto dentro del array
    // para asegurar que tengan 'id', 'fecha', y 'descripcion'. Por simplicidad, se omite aquí.
    // Ejemplo de validación simple:
    for (const accion of nuevasAccionesCompletas) {
      if (typeof accion.id !== 'string' || typeof accion.fecha !== 'string' || typeof accion.descripcion !== 'string') {
        return NextResponse.json(
          { message: "Cada acción en el array debe tener 'id', 'fecha' y 'descripcion' como strings." },
          { status: 400 }
        );
      }
    }

    // 4. Actualizar el ticket en la base de datos con el nuevo array de acciones completo
    // El frontend ya ha añadido la nueva acción al array con su ID, fecha y descripción.
    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data: {
        // Guardamos el array completo de acciones que nos envió el frontend,
        // convertido a string JSON.
        acciones: JSON.stringify(nuevasAccionesCompletas),
      },
    });

    if (!updatedTicket) {
      // Esto es poco probable con prisma.ticket.update si el ID no existe, ya que lanzaría un error.
      // Pero mantenemos una verificación por si acaso o por futuras lógicas.
      return NextResponse.json(
        { message: `No se encontró o no se pudo actualizar el ticket con el ID ${params.id}` },
        { status: 404 }
      );
    }

    // 5. Devolver el ticket actualizado
    return NextResponse.json(updatedTicket);

  } catch (error: any) {
    console.error("Error en POST /api/tickets/[id]/accion:", error); // Log del error en el servidor
    let errorMessage = "Error al agregar acción";
    if (error instanceof SyntaxError) { // Error común si el JSON está malformado
        errorMessage = "Error al parsear el JSON de la solicitud.";
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      { message: "Error interno del servidor al agregar acción.", error: errorMessage },
      { status: 500 } // Cambiado a 500 para errores internos no esperados
    );
  }
}
