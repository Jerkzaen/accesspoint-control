import { NextRequest, NextResponse } from "next/server";
import { TicketService } from "@/services/ticketService";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
// CORRECCIÓN CLAVE: Importamos la configuración de auth para ser explícitos.
import { authOptions } from "@/lib/auth";

/**
 * GET handler para obtener todas las acciones de un ticket específico.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id:string } }
) {
  // CORRECCIÓN CLAVE: Pasamos authOptions a getServerSession.
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const acciones = await TicketService.getAccionesByTicketId(params.id);
    return NextResponse.json(acciones, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error interno del servidor al obtener acciones." },
      { status: 500 }
    );
  }
}

/**
 * POST handler para crear una nueva acción en un ticket.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id:string } }
) {
  // CORRECCIÓN CLAVE: Pasamos authOptions a getServerSession.
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: "Usuario no autenticado." }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    const accionData = { 
        ...data, 
        ticketId: params.id, 
        usuarioId: session.user.id
    };

    const newAccion = await TicketService.addAccionToTicket(accionData);
    
    return NextResponse.json({ message: "Acción agregada con éxito.", accion: newAccion }, { status: 201 });

  } catch (error: any) {
    if (error.message === "El ticket no existe.") {
        return NextResponse.json({ message: "El ticket especificado no fue encontrado." }, { status: 404 });
    }
    if (error.name === 'ZodError') {
      return NextResponse.json({ message: "Datos de entrada inválidos.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Error interno al procesar la acción." },
      { status: 500 }
    );
  }
}
