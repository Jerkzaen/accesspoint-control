// src/app/api/equipos-en-prestamo/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { EquipoEnPrestamoService, EquipoEnPrestamoUpdateInput } from "@/services/equipoEnPrestamoService";
import { Prisma } from "@prisma/client";

/**
 * GET handler para obtener un registro de equipo en préstamo por su ID.
 * @param request El objeto de solicitud de Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del préstamo.
 * @returns Una respuesta JSON con el préstamo o un mensaje de error.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const prestamo = await EquipoEnPrestamoService.getEquipoEnPrestamoById(id);
    if (!prestamo) {
      return NextResponse.json({ message: "Registro de préstamo no encontrado" }, { status: 404 });
    }
    return NextResponse.json(prestamo);
  } catch (error) {
    console.error(`Error en GET /api/equipos-en-prestamo/${params.id}:`, error);
    return NextResponse.json(
      { message: "Error al obtener registro de préstamo", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler para actualizar un registro de equipo en préstamo existente.
 * @param request El objeto de solicitud de Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del préstamo.
 * @returns Una respuesta JSON con el préstamo actualizado o un mensaje de error.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data: EquipoEnPrestamoUpdateInput = await request.json();
    // Aseguramos que el ID de la ruta sobreescriba cualquier ID en el cuerpo.
    const updatedPrestamo = await EquipoEnPrestamoService.updateEquipoEnPrestamo({ ...data, id }); 
    return NextResponse.json(updatedPrestamo);
  } catch (error) {
    console.error(`Error en PUT /api/equipos-en-prestamo/${params.id}:`, error);
    if (error instanceof Error && 'issues' in error) { // ZodError
      return NextResponse.json(
        { message: "Error de validación al actualizar préstamo: " + (error as any).issues.map((i: any) => i.message).join(", ") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Error al actualizar registro de préstamo", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler para eliminar un registro de equipo en préstamo.
 * @param request El objeto de solicitud de Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del préstamo.
 * @returns Una respuesta JSON de éxito o un mensaje de error.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await EquipoEnPrestamoService.deleteEquipoEnPrestamo(id);
    if (!result.success) {
      return NextResponse.json({ message: result.message || "Error al eliminar registro de préstamo" }, { status: 400 });
    }
    return NextResponse.json({ message: result.message || "Registro de préstamo eliminado exitosamente" }, { status: 200 });
  } catch (error) {
    console.error(`Error en DELETE /api/equipos-en-prestamo/${params.id}:`, error);
    return NextResponse.json(
      { message: "Error al eliminar registro de préstamo", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
