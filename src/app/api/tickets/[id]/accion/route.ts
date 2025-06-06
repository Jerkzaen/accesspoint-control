//src/app/api/tickets/[id]/accion/route.ts

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Ajusta la ruta a tus authOptions
import { RoleUsuario } from "@prisma/client";

// Interfaz para el tipo de usuario esperado en la sesión
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  rol?: RoleUsuario; 
}

interface NewActionPayload {
  descripcion: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } } // id del Ticket
) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as SessionUser | undefined;

  if (!currentUser?.id) {
    return NextResponse.json(
      { message: "Usuario no autenticado." },
      { status: 401 }
    );
  }

  // Opcional: Validar rol si solo ciertos usuarios pueden agregar acciones
  // if (currentUser.rol !== "TECNICO" && currentUser.rol !== "ADMIN") {
  //   return NextResponse.json(
  //     { message: "Usuario no autorizado para agregar acciones." },
  //     { status: 403 }
  //   );
  // }

  try {
    const body = await request.json();
    const { descripcion } = body as NewActionPayload;

    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return NextResponse.json(
        { message: "La descripción de la acción es obligatoria." },
        { status: 400 }
      );
    }

    // Crear la nueva entrada en AccionTicket
    const nuevaAccion = await prisma.accionTicket.create({
      data: {
        ticketId: params.id, // ID del ticket al que pertenece esta acción
        descripcion: descripcion.trim(),
        usuarioId: currentUser.id, // ID del usuario logueado que realiza la acción
        // fechaAccion se establece por defecto con @default(now())
      },
    });

    // Después de crear la acción, obtener el ticket actualizado con todas sus acciones (incluyendo la nueva)
    // y la información del técnico que realizó cada acción.
    const ticketActualizado = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        acciones: { // Incluir todas las acciones asociadas
          orderBy: { fechaAccion: 'asc' }, // O 'desc' si prefieres las más nuevas primero
          include: {
            realizadaPor: { // Incluir los datos del usuario que realizó la acción
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        // Incluye otras relaciones del ticket que necesites devolver al frontend
        empresaCliente: { select: { id: true, nombre: true } },
        ubicacion: { select: { id: true, nombreReferencial: true, direccionCompleta: true } },
        tecnicoAsignado: { select: { id: true, name: true, email: true } },
      },
    });

    if (!ticketActualizado) {
      return NextResponse.json(
        { message: `Ticket con ID ${params.id} no encontrado después de agregar la acción.` },
        { status: 404 }
      );
    }
    
    // Devolver el ticket completo y actualizado (incluyendo todas sus acciones)
    return NextResponse.json(ticketActualizado);

  } catch (error: any) {
    console.error(`Error en POST /api/tickets/${params.id}/accion:`, error);
    let errorMessage = "Error al agregar la acción al ticket.";
    if (error.code === 'P2003' && error.meta?.field_name?.includes('ticketId')) {
        errorMessage = `El ticket con ID ${params.id} no existe.`;
        return NextResponse.json({ message: errorMessage, error: error.message }, { status: 404 });
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      { message: "Error interno del servidor al agregar acción.", error: errorMessage },
      { status: 500 }
    );
  }
}
