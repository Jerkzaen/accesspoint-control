// src/app/api/equipos-en-prestamo/route.ts

import { NextRequest, NextResponse } from "next/server";
import { EquipoEnPrestamoService, EquipoEnPrestamoCreateInput } from "@/services/equipoEnPrestamoService";
import { Prisma } from "@prisma/client";

/**
 * GET handler para obtener todos los registros de equipos en préstamo.
 * @param request El objeto de solicitud de Next.js.
 * @returns Una respuesta JSON con la lista de préstamos o un mensaje de error.
 */
export async function GET(request: NextRequest) {
  try {
    const prestamos = await EquipoEnPrestamoService.getEquiposEnPrestamo(true); // Incluir relaciones para la visualización
    return NextResponse.json(prestamos);
  } catch (error) {
    console.error("Error en GET /api/equipos-en-prestamo:", error);
    return NextResponse.json(
      { message: "Error al obtener registros de préstamo", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * POST handler para crear un nuevo registro de equipo en préstamo.
 * @param request El objeto de solicitud de Next.js.
 * @returns Una respuesta JSON con el préstamo creado o un mensaje de error.
 */
export async function POST(request: NextRequest) {
  try {
    const data: EquipoEnPrestamoCreateInput = await request.json();
    const newPrestamo = await EquipoEnPrestamoService.createEquipoEnPrestamo(data);
    return NextResponse.json(newPrestamo, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/equipos-en-prestamo:", error);
    if (error instanceof Error && 'issues' in error) { // ZodError
      return NextResponse.json(
        { message: "Error de validación al crear préstamo: " + (error as any).issues.map((i: any) => i.message).join(", ") },
        { status: 400 }
      );
    }
    // Puedes añadir manejo específico de errores de Prisma aquí si es necesario
    return NextResponse.json(
      { message: "Error al crear registro de préstamo", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
