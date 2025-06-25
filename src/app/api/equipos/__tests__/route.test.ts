// RUTA: src/app/api/equipos/route.ts

import { EquipoInventarioService, EquipoInventarioCreateInput } from "@/services/equipoInventarioService";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
// 1. --- IMPORTAMOS getServerSession ---
import { getServerSession } from "next-auth/next";


/**
 * GET handler para obtener todos los equipos de inventario.
 */
export async function GET(request: Request) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const equipos = await EquipoInventarioService.getEquiposInventario(true);
    return NextResponse.json(equipos, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/equipos:", error);
    return NextResponse.json(
      { message: "Error al obtener equipos de inventario" },
      { status: 500 }
    );
  }
}

/**
 * POST handler para crear un nuevo equipo.
 */
export async function POST(request: Request) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const data: EquipoInventarioCreateInput = await request.json();
    const newEquipo = await EquipoInventarioService.createEquipoInventario(data);
    return NextResponse.json(newEquipo, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/equipos:", error);
    if (error.message && error.message.startsWith("Error de validación")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { message: "Error al crear equipo: El identificador único ya existe." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Error al crear equipo" },
      { status: 500 }
    );
  }
}
