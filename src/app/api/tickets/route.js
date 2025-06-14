// RUTA: src/app/api/tickets/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { RoleUsuario } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const searchText = searchParams.get("searchText");
  const estado = searchParams.get("estado");
  const prioridad = searchParams.get("prioridad");

  const userRole = session.user.rol;
  const userId = session.user.id;
  
  let where = {};

  if (userRole === RoleUsuario.CLIENTE) {
    where.solicitanteClienteId = userId;
  } else if (userRole === RoleUsuario.TECNICO) {
    where.tecnicoAsignadoId = userId;
  }

  if (searchText) {
    // ======================= INICIO DE LA CORRECCIÓN =======================
    // Eliminamos el `mode: 'insensitive'` que causa el error.
    // La búsqueda ahora será sensible a mayúsculas/minúsculas.
    where.OR = [
      { titulo: { contains: searchText } },
      { descripcionDetallada: { contains: searchText } },
      { numeroCaso: { equals: isNaN(parseInt(searchText)) ? undefined : parseInt(searchText) } },
      { empresaCliente: { nombre: { contains: searchText } } },
    ];
    // ======================== FIN DE LA CORRECCIÓN =========================
  }

  if (estado && estado !== 'Todos') {
    where.estado = estado;
  }

  if (prioridad && prioridad !== 'Todas') {
    where.prioridad = prioridad;
  }

  try {
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        empresaCliente: true,
        solicitanteCliente: true,
        tecnicoAsignado: true,
        ubicacion: true,
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error al obtener tickets:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
