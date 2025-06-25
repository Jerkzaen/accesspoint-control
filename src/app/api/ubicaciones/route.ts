// src/app/api/ubicaciones/route.ts

import { UbicacionService, UbicacionCreateInput } from "@/services/ubicacionService";
import { Prisma } from "@prisma/client";

// Utilidad para serializar fechas en los objetos de ubicación
function serializeUbicacion(ubicacion: any) {
  return {
    ...ubicacion,
    createdAt: ubicacion.createdAt?.toISOString?.() ?? ubicacion.createdAt,
    updatedAt: ubicacion.updatedAt?.toISOString?.() ?? ubicacion.updatedAt,
    sucursal: ubicacion.sucursal
      ? {
          ...ubicacion.sucursal,
          createdAt: ubicacion.sucursal.createdAt?.toISOString?.() ?? ubicacion.sucursal.createdAt,
          updatedAt: ubicacion.sucursal.updatedAt?.toISOString?.() ?? ubicacion.sucursal.updatedAt,
        }
      : null,
  };
}

/**
 * GET handler para obtener todas las ubicaciones.
 * @param request La solicitud Next.js.
 * @returns Una respuesta JSON con las ubicaciones o un mensaje de error.
 */
export async function GET(request: Request) {
  try {
    const ubicaciones = await UbicacionService.getUbicaciones(true);
    const serialized = Array.isArray(ubicaciones)
      ? ubicaciones.map(serializeUbicacion)
      : [];
    return new Response(JSON.stringify(serialized), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en GET /api/ubicaciones:", error);
    return new Response(
      JSON.stringify({
        message: "Error al obtener ubicaciones",
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * POST handler para crear una nueva ubicación.
 * @param request La solicitud Next.js.
 * @returns Una respuesta JSON con la ubicación creada o un mensaje de error.
 */
export async function POST(request: Request) {
  try {
    const data: UbicacionCreateInput = await request.json();
    const newUbicacion = await UbicacionService.createUbicacion(data);
    const serialized = serializeUbicacion(newUbicacion);
    return new Response(JSON.stringify(serialized), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error en POST /api/ubicaciones:", error);
    if (error.message && error.message.startsWith("Error de validación al crear ubicación:")) {
      return new Response(
        JSON.stringify({ message: error.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({
        message: "Error al crear ubicación",
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
