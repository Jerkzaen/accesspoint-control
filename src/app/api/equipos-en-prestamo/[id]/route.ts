// RUTA: src/app/api/equipos-en-prestamo/[id]/route.ts

import { NextResponse } from "next/server";
import { EquipoEnPrestamoService, EquipoEnPrestamoUpdateInput } from "@/services/equipoEnPrestamoService";
// 1. --- IMPORTAMOS getServerSession ---
import { getServerSession } from "next-auth/next";

/**
 * GET handler para obtener un registro de préstamo por su ID.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const prestamo = await EquipoEnPrestamoService.getEquipoEnPrestamoById(params.id);
    if (!prestamo) {
      return NextResponse.json({ message: "Registro de préstamo no encontrado" }, { status: 404 });
    }
    return NextResponse.json(prestamo);
  } catch (error) {
    console.error(`Error en GET /api/equipos-en-prestamo/${params.id}:`, error);
    return NextResponse.json({ message: "Error al obtener registro de préstamo" }, { status: 500 });
  }
}

/**
 * PUT handler para actualizar un registro de préstamo por su ID.
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const data: Omit<EquipoEnPrestamoUpdateInput, 'id'> = await request.json();
    const updatedPrestamo = await EquipoEnPrestamoService.updateEquipoEnPrestamo({ ...data, id: params.id });
    return NextResponse.json(updatedPrestamo, { status: 200 });
  } catch (error: any) {
    console.error(`Error en PUT /api/equipos-en-prestamo/${params.id}:`, error);
    if (error?.message && error.message.startsWith('Error de validación')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Error al actualizar registro de préstamo" }, { status: 500 });
  }
}

/**
 * DELETE handler para eliminar un registro de préstamo por su ID.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    await EquipoEnPrestamoService.deleteEquipoEnPrestamo(params.id);
    return NextResponse.json({ message: "Registro de préstamo eliminado exitosamente" }, { status: 200 });
  } catch (error: any) {
    console.error(`Error en DELETE /api/equipos-en-prestamo/${params.id}:`, error);
    return NextResponse.json({ message: "Error al eliminar registro de préstamo" }, { status: 500 });
  }
}
