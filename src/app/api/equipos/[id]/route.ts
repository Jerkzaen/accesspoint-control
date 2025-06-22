// src/app/api/equipos/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { EquipoInventarioService, EquipoInventarioUpdateInput } from "@/services/equipoInventarioService";
import { Prisma } from "@prisma/client";

/**
 * GET handler to retrieve an inventory item by its ID.
 * @param request The Next.js request object.
 * @param params The route parameters, including the equipment ID.
 * @returns A JSON response with the equipment or an error message.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const equipo = await EquipoInventarioService.getEquipoInventarioById(id);
    if (!equipo) {
      return NextResponse.json({ message: "Equipo no encontrado" }, { status: 404 });
    }
    return NextResponse.json(equipo);
  } catch (error) {
    console.error(`Error in GET /api/equipos/${params.id}:`, error);
    return NextResponse.json(
      { message: "Error al obtener equipo", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler to update an existing inventory item.
 * @param request The Next.js request object.
 * @param params The route parameters, including the equipment ID.
 * @returns A JSON response with the updated equipment or an error message.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data: EquipoInventarioUpdateInput = await request.json();
    // Ensure the route ID overwrites any ID in the body.
    const updatedEquipo = await EquipoInventarioService.updateEquipoInventario({ ...data, id }); 
    return NextResponse.json(updatedEquipo);
  } catch (error) {
    console.error(`Error in PUT /api/equipos/${params.id}:`, error);
    if (error instanceof Error && 'issues' in error) { // ZodError
      return NextResponse.json(
        { message: "Error de validación al actualizar equipo: " + (error as any).issues.map((i: any) => i.message).join(", ") },
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { // Unique constraint failed (e.g., on identificadorUnico)
        return NextResponse.json(
          { message: "Error al actualizar equipo: El identificador único ya existe.", error: error.message },
          { status: 409 } // Conflict
        );
      }
    }
    return NextResponse.json(
      { message: "Error al actualizar equipo", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler to remove an inventory item.
 * @param request The Next.js request object.
 * @param params The route parameters, including the equipment ID.
 * @returns A successful JSON response or an error message.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await EquipoInventarioService.deleteEquipoInventario(id);
    if (!result.success) {
      return NextResponse.json({ message: result.message || "Error al eliminar equipo" }, { status: 400 });
    }
    return NextResponse.json({ message: result.message || "Equipo eliminado exitosamente" }, { status: 200 });
  } catch (error) {
    console.error(`Error in DELETE /api/equipos/${params.id}:`, error);
    return NextResponse.json(
      { message: "Error al eliminar equipo", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
