// RUTA: src/app/api/ubicaciones/[id]/route.ts

import { UbicacionService, UbicacionUpdateInput } from "@/services/ubicacionService";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  try {
    const ubicacion = await UbicacionService.getUbicacionById(params.id);
    if (!ubicacion) {
      return NextResponse.json({ message: "Ubicación no encontrada" }, { status: 404 });
    }
    return NextResponse.json(ubicacion);
  } catch (error) {
    console.error("Error en GET /api/ubicaciones/[id]:", error);
    return NextResponse.json({ message: "Error al obtener ubicación" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  try {
    const data: Omit<UbicacionUpdateInput, 'id'> = await request.json();
    const updatedUbicacion = await UbicacionService.updateUbicacion({ ...data, id: params.id });
    return NextResponse.json(updatedUbicacion, { status: 200 });
  } catch (error: any) {
    console.error("Error en PUT /api/ubicaciones/[id]:", error);
    if (error.message && error.message.startsWith("Error de validación")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Error al actualizar ubicación" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  try {
    await UbicacionService.deleteUbicacion(params.id);
    return NextResponse.json({ message: "Ubicación eliminada exitosamente" }, { status: 200 });
  } catch (error: any) {
    console.error("Error en DELETE /api/ubicaciones/[id]:", error);
    if (error.message && (error.message.includes('contactos asociados') || error.message.includes('equipos de inventario asociados'))) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Error al eliminar ubicación" }, { status: 500 });
  }
}
