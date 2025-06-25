// RUTA: src/app/api/equipos/[id]/route.ts

import { EquipoInventarioService, EquipoInventarioUpdateInput } from "@/services/equipoInventarioService";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
// --- IMPORTAMOS getServerSession ---
import { getServerSession } from "next-auth/next";

/**
 * GET handler para obtener un equipo por su ID.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const equipo = await EquipoInventarioService.getEquipoInventarioById(params.id);
    if (!equipo) {
      return NextResponse.json({ message: "Equipo no encontrado" }, { status: 404 });
    }
    return NextResponse.json(equipo, { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/equipos/[id]:", error);
    return NextResponse.json({ message: "Error al obtener equipo" }, { status: 500 });
  }
}

/**
 * PUT handler para actualizar un equipo por su ID.
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const data: Omit<EquipoInventarioUpdateInput, 'id'> = await request.json();
    // --- CORRECCIÓN: Pasamos un solo objeto que incluye el 'id' ---
    const updatedEquipo = await EquipoInventarioService.updateEquipoInventario({ ...data, id: params.id });
    return NextResponse.json(updatedEquipo, { status: 200 });
  } catch (error: any) {
    console.error("Error en PUT /api/equipos/[id]:", error);
    if (error.message && error.message.startsWith("Error de validación")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Error al actualizar equipo: El identificador único ya existe.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ message: "Error al actualizar equipo" }, { status: 500 });
  }
}

/**
 * DELETE handler para eliminar un equipo por su ID.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  
  try {
    await EquipoInventarioService.deleteEquipoInventario(params.id);
    return NextResponse.json({ message: 'Equipo de inventario eliminado exitosamente' }, { status: 200 });
  } catch (error: any) {
    console.error("Error en DELETE /api/equipos/[id]:", error);
    const msg = error.message || '';
    if (/pr[eé]stamos asociados/i.test(msg)) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error al eliminar equipo' }, { status: 500 });
  }
}
