// src/app/api/ubicaciones/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const ubicaciones = await prisma.ubicacion.findMany({
      select: {
        id: true,
        nombreReferencial: true,
        direccionCompleta: true,
      },
      orderBy: { nombreReferencial: 'asc' },
    });
    return NextResponse.json(ubicaciones);
  } catch (error) { // 'error' es de tipo 'unknown' aquí
    console.error("Error en GET /api/ubicaciones:", error);
    // Verificar si 'error' es una instancia de Error antes de acceder a 'message'
    return NextResponse.json(
      { message: "Error al obtener ubicaciones", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
