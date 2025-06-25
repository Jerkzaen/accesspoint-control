// src/app/api/equipos/route.ts

import { EquipoInventarioService, EquipoInventarioCreateInput } from "@/services/equipoInventarioService";
import { Prisma } from "@prisma/client";

// Utilidad para serializar fechas en los objetos de equipo
function serializeEquipo(equipo: any) {
  return {
    ...equipo,
    createdAt: equipo.createdAt?.toISOString?.() ?? equipo.createdAt,
    updatedAt: equipo.updatedAt?.toISOString?.() ?? equipo.updatedAt,
    fechaAdquisicion: equipo.fechaAdquisicion?.toISOString?.() ?? equipo.fechaAdquisicion,
    ubicacionActual: equipo.ubicacionActual
      ? {
          ...equipo.ubicacionActual,
          createdAt: equipo.ubicacionActual.createdAt?.toISOString?.() ?? equipo.ubicacionActual.createdAt,
          updatedAt: equipo.ubicacionActual.updatedAt?.toISOString?.() ?? equipo.ubicacionActual.updatedAt,
        }
      : null,
    empresa: equipo.empresa
      ? {
          ...equipo.empresa,
          createdAt: equipo.empresa.createdAt?.toISOString?.() ?? equipo.empresa.createdAt,
          updatedAt: equipo.empresa.updatedAt?.toISOString?.() ?? equipo.empresa.updatedAt,
        }
      : null,
  };
}

/**
 * GET handler para obtener todos los equipos de inventario.
 * @param request The Next.js request object.
 * @returns A JSON response with the equipment list or an error message.
 */
export async function GET(request: Request) {
  try {
    const equipos = await EquipoInventarioService.getEquiposInventario(true);
    const serialized = Array.isArray(equipos)
      ? equipos.map(serializeEquipo)
      : [];
    return new Response(JSON.stringify(serialized), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/equipos:", error);
    return new Response(
      JSON.stringify({
        message: "Error al obtener equipos de inventario",
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * POST handler for creating a new inventory item.
 * @param request The Next.js request object.
 * @returns A JSON response with the created equipment or an error message.
 */
export async function POST(request: Request) {
  try {
    const data: EquipoInventarioCreateInput = await request.json();
    const newEquipo = await EquipoInventarioService.createEquipoInventario(data);
    const serialized = serializeEquipo(newEquipo);
    return new Response(JSON.stringify(serialized), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in POST /api/equipos:", error);
    if (error.message && error.message.startsWith("Error de validación al crear equipo:")) {
      return new Response(
        JSON.stringify({ message: error.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new Response(
        JSON.stringify({
          message: "Error al crear equipo: El identificador único ya existe.",
          error: error.message,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({
        message: "Error al crear equipo",
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
