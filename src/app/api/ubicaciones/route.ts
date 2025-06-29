// RUTA: src/app/api/ubicaciones/route.ts

import { GeografiaService } from "@/services/geografiaService";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ZodError } from "zod";
import { ubicacionCreateSchema, UbicacionCreateInput } from "@/lib/validators/ubicacionValidator";
import { Ubicacion } from "@prisma/client"; // Importar el tipo Ubicacion


/**
 * GET handler para obtener ubicaciones.
 * Permite filtrar por sucursalId mediante un query parameter.
 */
export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const sucursalId = url.searchParams.get('sucursalId');

    let ubicaciones: Ubicacion[]; // <--- ¡Corrección aquí! Tipo explícito
    if (sucursalId) {
      ubicaciones = await GeografiaService.getUbicacionesBySucursal(sucursalId);
    } else {
      ubicaciones = []; 
      console.warn("Advertencia: No se proporcionó sucursalId para /api/ubicaciones. Devolviendo un array vacío.");
    }
    
    return NextResponse.json(ubicaciones, { status: 200 });
  } catch (error: any) {
    console.error("Error en GET /api/ubicaciones:", error);
    return NextResponse.json(
      { message: error.message || "Error al obtener ubicaciones" },
      { status: 500 }
    );
  }
}

/**
 * POST handler para crear una nueva ubicación.
 */
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const rawData = await request.json();
    const data: UbicacionCreateInput = ubicacionCreateSchema.parse(rawData);

    const newUbicacion = await GeografiaService.createUbicacion(data);
    return NextResponse.json(newUbicacion, { status: 201 });
  } catch (error: any) {
    console.error("Error en POST /api/ubicaciones:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: `Error de validación: ${error.errors.map(e => e.message).join(', ')}` }, { status: 400 });
    }
    return NextResponse.json(
      { message: error.message || "Error al crear ubicación" },
      { status: 500 }
    );
  }
}
