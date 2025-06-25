// src/app/api/equipos/[id]/route.ts

import { EquipoInventarioService, EquipoInventarioUpdateInput } from "@/services/equipoInventarioService";
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
 * GET handler to retrieve an inventory item by its ID.
 * @param request The Next.js request object.
 * @param params The route parameters, including the equipment ID.
 * @returns A JSON response with the equipment or an error message.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const equipo = await EquipoInventarioService.getEquipoInventarioById(params.id);
    if (!equipo) {
      return new Response(JSON.stringify({ message: "Equipo no encontrado" }), { status: 404 });
    }
    const serialized = serializeEquipo(equipo);
    return new Response(JSON.stringify(serialized), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Error al obtener equipo" }), { status: 500 });
  }
}

/**
 * PUT handler to update an existing inventory item.
 * @param request The Next.js request object.
 * @param params The route parameters, including the equipment ID.
 * @returns A JSON response with the updated equipment or an error message.
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data: EquipoInventarioUpdateInput = await request.json();
    const updatedEquipo = await EquipoInventarioService.updateEquipoInventario({ ...data, id: params.id });
    const serialized = serializeEquipo(updatedEquipo);
    return new Response(JSON.stringify(serialized), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    if (error.message && error.message.startsWith("Error de validación al actualizar equipo:")) {
      return new Response(JSON.stringify({ message: error.message }), { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new Response(JSON.stringify({ message: 'Error al actualizar equipo: El identificador único ya existe.' }), { status: 409 });
    }
    return new Response(JSON.stringify({ message: "Error al actualizar equipo" }), { status: 500 });
  }
}

/**
 * DELETE handler to remove an inventory item.
 * @param request The Next.js request object.
 * @param params The route parameters, including the equipment ID.
 * @returns A successful JSON response or an error message.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await EquipoInventarioService.deleteEquipoInventario(params.id);
    // El mensaje esperado por el test no lleva punto final
    return new Response(JSON.stringify({ message: 'Equipo de inventario eliminado exitosamente' }), { status: 200 });
  } catch (error: any) {
    const msg = error.message || '';
    if (/pr[eé]stamos asociados/i.test(msg)) {
      return new Response(JSON.stringify({ message: error.message }), { status: 400 });
    }
    return new Response(JSON.stringify({ message: 'Error al eliminar equipo' }), { status: 500 });
  }
}
