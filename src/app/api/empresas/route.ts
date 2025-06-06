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
  } catch (error) {
    console.error("Error en GET /api/empresas:", error);
    return NextResponse.json(
      { message: "Error al obtener empresas", error: error.message },
      { status: 500 }
    );
  }
}
