// src/app/api/empresas/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const empresas = await prisma.empresaCliente.findMany({
      select: {
        id: true,
        nombre: true,
      },
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json(empresas);
  } catch (error) { // 'error' es de tipo 'unknown' aquí
    console.error("Error en GET /api/empresas:", error);
    // Verificar si 'error' es una instancia de Error antes de acceder a 'message'
    return NextResponse.json(
      { message: "Error al obtener empresas", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
