// RUTA: src/app/api/tickets/[id]/accion/route.ts

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

export const dynamic = 'force-dynamic';

// Obtiene todas las acciones para un ticket específico.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // id del Ticket
) {
  const { id } = params;
  
  try {
    const actions = await prisma.accionTicket.findMany({
      where: { ticketId: id },
      include: {
        realizadaPor: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      // --- CAMBIO UX: ORDENAMIENTO DE LA BITÁCORA ---
      // Se ordena por fecha de la acción en orden descendente,
      // para mostrar la acción más reciente primero.
      orderBy: { fechaAccion: 'desc' }, 
    });
    return NextResponse.json(actions);
  } catch (error: any) {
    console.error(`Error en GET /api/tickets/${id}/accion:`, error);
    return NextResponse.json(
      { message: "Error interno del servidor al obtener acciones." },
      { status: 500 }
    );
  }
}

// Agrega una nueva acción a un ticket.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } } // id del Ticket
) {
  const { id } = params;
  
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as SessionUser | undefined;

  if (!currentUser?.id) {
    return NextResponse.json({ message: "Usuario no autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { descripcion } = body as NewActionPayload;

    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      return NextResponse.json({ message: "La descripción de la acción es obligatoria." }, { status: 400 });
    }

    await prisma.accionTicket.create({
      data: {
        ticketId: id,
        descripcion: descripcion.trim(),
        usuarioId: currentUser.id,
      },
    });

    return NextResponse.json({ message: "Acción agregada con éxito." }, { status: 201 });

  } catch (error: any) {
    console.error(`Error en POST /api/tickets/${id}/accion:`, error);
    let errorMessage = "Error al agregar la acción al ticket.";
    if (error.code === 'P2003') {
        errorMessage = `El ticket con ID ${id} no existe.`;
        return NextResponse.json({ message: errorMessage }, { status: 404 });
    }
    return NextResponse.json({ message: "Error interno del servidor.", error: error.message }, { status: 500 });
  }
}
