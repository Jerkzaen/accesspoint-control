// RUTA: src/app/api/ubicaciones/route.ts

import { UbicacionService, UbicacionCreateInput } from "@/services/ubicacionService";
import { NextResponse } from "next/server";
// 1. --- IMPORTAMOS getServerSession ---
import { getServerSession } from "next-auth/next";

/**
 * GET handler para obtener todas las ubicaciones.
 */
export async function GET(request: Request) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const ubicaciones = await UbicacionService.getUbicaciones(true);
    // 3. --- SIMPLIFICAMOS LA RESPUESTA ---
    // NextResponse.json se encarga de serializar correctamente las fechas.
    return NextResponse.json(ubicaciones, { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/ubicaciones:", error);
    return NextResponse.json(
      { message: "Error al obtener ubicaciones" },
      { status: 500 }
    );
  }
}

/**
 * POST handler para crear una nueva ubicación.
 */
export async function POST(request: Request) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const data: UbicacionCreateInput = await request.json();
    const newUbicacion = await UbicacionService.createUbicacion(data);
    // 3. --- SIMPLIFICAMOS LA RESPUESTA ---
    return NextResponse.json(newUbicacion, { status: 201 });
  } catch (error: any) {
    console.error("Error en POST /api/ubicaciones:", error);
    if (error.message && error.message.startsWith("Error de validación")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Error al crear ubicación" },
      { status: 500 }
    );
  }
}
