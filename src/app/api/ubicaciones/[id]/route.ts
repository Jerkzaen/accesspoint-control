// src/app/api/ubicaciones/[id]/route.ts

import { UbicacionService, UbicacionUpdateInput } from "@/services/ubicacionService";
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
 * GET handler para obtener una ubicación por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID de la ubicación.
 * @returns Una respuesta JSON con la ubicación o un mensaje de error.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ubicacion = await UbicacionService.getUbicacionById(params.id);
    if (!ubicacion) {
      return new Response(JSON.stringify({ message: "Ubicación no encontrada" }), { status: 404 });
    }
    const serialized = serializeUbicacion(ubicacion);
    return new Response(JSON.stringify(serialized), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Error al obtener ubicación" }), { status: 500 });
  }
}

/**
 * PUT handler para actualizar una ubicación por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID de la ubicación.
 * @returns Una respuesta JSON con la ubicación actualizada o un mensaje de error.
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data: UbicacionUpdateInput = await request.json();
    const updatedUbicacion = await UbicacionService.updateUbicacion({ ...data, id: params.id });
    const serialized = serializeUbicacion(updatedUbicacion);
    return new Response(JSON.stringify(serialized), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    if (error.message && error.message.startsWith("Error de validación al actualizar ubicación:")) {
      return new Response(JSON.stringify({ message: error.message }), { status: 400 });
    }
    return new Response(JSON.stringify({ message: "Error al actualizar ubicación" }), { status: 500 });
  }
}

/**
 * DELETE handler para eliminar una ubicación por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID de la ubicación.
 * @returns Una respuesta JSON de éxito o un mensaje de error.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await UbicacionService.deleteUbicacion(params.id);
    // El mensaje esperado por el test no lleva punto final
    return new Response(JSON.stringify({ message: 'Ubicación eliminada exitosamente' }), { status: 200 });
  } catch (error: any) {
    const msg = error.message || '';
    if (
      /contactos asociados/i.test(msg) ||
      /equipos de inventario asociados/i.test(msg)
    ) {
      return new Response(JSON.stringify({ message: error.message }), { status: 400 });
    }
    return new Response(JSON.stringify({ message: 'Error al eliminar ubicación' }), { status: 500 });
  }
}
