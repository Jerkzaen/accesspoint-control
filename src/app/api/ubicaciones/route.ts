// src/app/api/ubicaciones/route.ts

import { NextResponse } from "next/server";
import { GeografiaService } from "@/services/geografiaService"; // Importar el nuevo servicio

/**
 * GET handler para obtener todas las ubicaciones.
 * Delega la lógica al `GeografiaService`.
 * @returns Una respuesta JSON con las ubicaciones o un mensaje de error.
 */
export async function GET() {
  try {
    const ubicaciones = await GeografiaService.getUbicaciones();
    return NextResponse.json(ubicaciones);
  } catch (error) {
    console.error("Error en GET /api/ubicaciones (API Route):", error);
    return NextResponse.json(
      { message: "Error al obtener ubicaciones", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
