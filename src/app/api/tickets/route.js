// RUTA: src/app/api/tickets/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { RoleUsuario } from "@prisma/client";

// Asegurarse de que la ruta es siempre dinámica
export const dynamic = 'force-dynamic';
// Forzar que no se use caché para los fetch
export const fetchCache = 'force-no-store';

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
  let roleFilter = {};

  // Filtros basados en rol
  if (userRole === RoleUsuario.CLIENTE) {
    // Permitir que los clientes vean tickets donde son el solicitante asignado
    // O donde su email coincide con el solicitanteCorreo (para tickets de carga masiva)
    const userEmail = session.user.email;
    roleFilter.OR = [
      { solicitanteClienteId: userId },
      { solicitanteCorreo: userEmail }
    ];
  } else if (userRole === RoleUsuario.TECNICO) {
    roleFilter.tecnicoAsignadoId = userId;
  }

  // Filtros de búsqueda
  let searchFilter = {};
  if (searchText) {
    searchFilter.OR = [
      { titulo: { contains: searchText } },
      { descripcionDetallada: { contains: searchText } },
      { numeroCaso: { equals: isNaN(parseInt(searchText)) ? undefined : parseInt(searchText) } },
      { empresa: { nombre: { contains: searchText } } },
    ];
  }

  // Combinar filtros usando AND
  let conditions = [];

  if (Object.keys(roleFilter).length > 0) {
    conditions.push(roleFilter);
  }

  if (Object.keys(searchFilter).length > 0) {
    conditions.push(searchFilter);
  }

  if (estado && estado !== 'Todos') {
    conditions.push({ estado: estado });
  }

  if (prioridad && prioridad !== 'Todas') {
    conditions.push({ prioridad: prioridad });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  console.log("Prisma where clause:", JSON.stringify(where, null, 2));

  try {
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        empresa: true,
        solicitanteCliente: true,
        tecnicoAsignado: true,
        ubicacionReporte: true,
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error al obtener tickets:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
