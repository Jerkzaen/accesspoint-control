// src/app/api/ubicaciones/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { UbicacionService, UbicacionUpdateInput } from "@/services/ubicacionService";
import { Prisma } from "@prisma/client";

/**
 * GET handler para obtener una ubicación por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID de la ubicación.
 * @returns Una respuesta JSON con la ubicación o un mensaje de error.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const ubicacion = await UbicacionService.getUbicacionById(id);
    if (!ubicacion) {
      return NextResponse.json({ message: "Ubicación no encontrada" }, { status: 404 });
    }
    return NextResponse.json(ubicacion);
  } catch (error) {
    console.error(`Error en GET /api/ubicaciones/${params.id}:`, error);
    return NextResponse.json(
      { message: "Error al obtener ubicación", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler para actualizar una ubicación por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID de la ubicación.
 * @returns Una respuesta JSON con la ubicación actualizada o un mensaje de error.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data: UbicacionUpdateInput = await request.json();
    // Aseguramos que el ID de la ruta sobreescriba cualquier ID en el cuerpo.
    const updatedUbicacion = await UbicacionService.updateUbicacion({ ...data, id }); 
    return NextResponse.json(updatedUbicacion);
  } catch (error) {
    console.error(`Error en PUT /api/ubicaciones/${params.id}:`, error);
    if (error instanceof Error && 'issues' in error) { // ZodError
      return NextResponse.json(
        { message: "Error de validación al actualizar ubicación: " + (error as any).issues.map((i: any) => i.message).join(", ") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Error al actualizar ubicación", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler para eliminar una ubicación por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID de la ubicación.
 * @returns Una respuesta JSON de éxito o un mensaje de error.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await UbicacionService.deleteUbicacion(id);
    if (!result.success) {
      return NextResponse.json({ message: result.message || "Error al eliminar ubicación" }, { status: 400 });
    }
    return NextResponse.json({ message: result.message || "Ubicación eliminada exitosamente" }, { status: 200 });
  } catch (error) {
    console.error(`Error en DELETE /api/ubicaciones/${params.id}:`, error);
    return NextResponse.json(
      { message: "Error al eliminar ubicación", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
