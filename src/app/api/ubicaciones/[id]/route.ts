// RUTA: src/app/api/ubicaciones/[id]/route.ts

import { GeografiaService } from "@/services/geografiaService";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ZodError } from "zod";
import { ubicacionUpdateSchema, UbicacionUpdateInput } from "@/lib/validators/ubicacionValidator";
import { Prisma } from "@prisma/client";


export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  try {
    const ubicacion = await GeografiaService.getUbicacionById(params.id);
    if (!ubicacion) {
      return NextResponse.json({ message: "Ubicación no encontrada" }, { status: 404 });
    }
    return NextResponse.json(ubicacion);
  } catch (error: any) {
    console.error("Error en GET /api/ubicaciones/[id]:", error);
    return NextResponse.json(
      { message: error.message || "Error al obtener ubicación" },
      { status: 500 }
    );
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
    const rawData = await request.json();
    const data: Omit<UbicacionUpdateInput, 'id'> = ubicacionUpdateSchema.parse(rawData);

    const updatedUbicacion = await GeografiaService.updateUbicacion(params.id, data);
    return NextResponse.json(updatedUbicacion, { status: 200 });
  } catch (error: any) {
    console.error("Error en PUT /api/ubicaciones/[id]:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: `Error de validación: ${error.errors.map(e => e.message).join(', ')}` }, { status: 400 });
    }
    return NextResponse.json(
      { message: error.message || "Error al actualizar ubicación" },
      { status: 500 }
    );
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
    await GeografiaService.deactivateUbicacion(params.id);
    return NextResponse.json({ message: "Ubicación desactivada exitosamente" }, { status: 200 });
  } catch (error: any) {
    console.error("Error en DELETE (deactivate) /api/ubicaciones/[id]:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return NextResponse.json({ message: 'No se puede desactivar la ubicación debido a elementos asociados (contactos, equipos).' }, { status: 400 });
    }
    return NextResponse.json(
      { message: error.message || "Error al desactivar ubicación" },
      { status: 500 }
    );
  }
}
