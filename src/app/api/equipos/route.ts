// src/app/api/equipos/route.ts

import { NextRequest, NextResponse } from "next/server";
import { EquipoInventarioService, EquipoInventarioCreateInput } from "@/services/equipoInventarioService";
import { Prisma } from "@prisma/client";

/**
 * GET handler para obtener todos los equipos de inventario.
 * @param request The Next.js request object.
 * @returns A JSON response with the equipment list or an error message.
 */
export async function GET(request: NextRequest) {
  try {
    const equipos = await EquipoInventarioService.getEquiposInventario(true); // Include relations for general viewing
    return NextResponse.json(equipos);
  } catch (error) {
    console.error("Error in GET /api/equipos:", error);
    return NextResponse.json(
      { message: "Error al obtener equipos de inventario", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new inventory item.
 * @param request The Next.js request object.
 * @returns A JSON response with the created equipment or an error message.
 */
export async function POST(request: NextRequest) {
  try {
    const data: EquipoInventarioCreateInput = await request.json();
    const newEquipo = await EquipoInventarioService.createEquipoInventario(data);
    return NextResponse.json(newEquipo, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/equipos:", error);
    if (error instanceof Error && 'issues' in error) { // ZodError
      return NextResponse.json(
        { message: "Error de validación al crear equipo: " + (error as any).issues.map((i: any) => i.message).join(", ") },
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { // Unique constraint failed (e.g., on identificadorUnico)
        return NextResponse.json(
          { message: "Error al crear equipo: El identificador único ya existe.", error: error.message },
          { status: 409 } // Conflict
        );
      }
    }
    return NextResponse.json(
      { message: "Error al crear equipo", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
