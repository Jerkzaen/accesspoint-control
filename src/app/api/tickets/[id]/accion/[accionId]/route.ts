// RUTA: src/app/api/tickets/[id]/accion/[accionId]/route.ts
// VERSIÓN CON ACCIONES INMUTABLES: Los métodos PUT y DELETE ahora devuelven un error 405.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TicketService } from '@/services/ticketService';

// GET para una acción específica sigue siendo válido, podría ser útil para ver detalles.
// (Esta función probablemente no exista en tu archivo, pero la dejamos como ejemplo de lo que SÍ se permite)
export async function GET(req: NextRequest, { params }: { params: { accionId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    // Aquí iría la lógica para obtener una sola acción por su ID si fuera necesario.
    // Por ahora, devolvemos un método no implementado como placeholder.
    return NextResponse.json({ message: "GET para una acción específica no implementado." }, { status: 501 });
}


// --- INMUTABILIDAD APLICADA ---

/**
 * Método PUT deshabilitado. Las acciones de un ticket son inmutables.
 * Devuelve un error 405 (Method Not Allowed).
 */
export async function PUT() {
  return NextResponse.json(
    { message: "El método PUT no está permitido. Las acciones de los tickets son inmutables." },
    { status: 405 }
  );
}

/**
 * Método DELETE deshabilitado. Las acciones de un ticket son inmutables.
 * Devuelve un error 405 (Method Not Allowed).
 */
export async function DELETE() {
  return NextResponse.json(
    { message: "El método DELETE no está permitido. Las acciones de los tickets son inmutables." },
    { status: 405 }
  );
}
