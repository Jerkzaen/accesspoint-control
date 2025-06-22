// src/app/api/ubicaciones/route.ts

import { NextRequest, NextResponse } from "next/server";
import { UbicacionService, UbicacionCreateInput } from "@/services/ubicacionService";
import { Prisma } from "@prisma/client";

/**
 * GET handler para obtener todas las ubicaciones.
 * @param request La solicitud Next.js.
 * @returns Una respuesta JSON con las ubicaciones o un mensaje de error.
 */
export async function GET(request: NextRequest) {
  try {
    const ubicaciones = await UbicacionService.getUbicaciones(true); // Incluimos relaciones para la visualización
    return NextResponse.json(ubicaciones);
  } catch (error) {
    console.error("Error en GET /api/ubicaciones:", error);
    return NextResponse.json(
      { message: "Error al obtener ubicaciones", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * POST handler para crear una nueva ubicación.
 * @param request La solicitud Next.js.
 * @returns Una respuesta JSON con la ubicación creada o un mensaje de error.
 */
export async function POST(request: NextRequest) {
  try {
    const data: UbicacionCreateInput = await request.json();
    const newUbicacion = await UbicacionService.createUbicacion(data);
    return NextResponse.json(newUbicacion, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/ubicaciones:", error);
    if (error instanceof Error && 'issues' in error) { // ZodError
      return NextResponse.json(
        { message: "Error de validación al crear ubicación: " + (error as any).issues.map((i: any) => i.message).join(", ") },
        { status: 400 }
      );
    }
    // Puedes añadir manejo específico de errores de Prisma aquí si es necesario (ej. clave única)
    return NextResponse.json(
      { message: "Error al crear ubicación", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
