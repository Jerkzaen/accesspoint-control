// RUTA: src/app/api/equipos-en-prestamo/route.ts

import { NextResponse } from "next/server";
import { EquipoEnPrestamoService, EquipoEnPrestamoCreateInput } from "@/services/equipoEnPrestamoService";
// 1. --- IMPORTAMOS getServerSession ---
import { getServerSession } from "next-auth/next";

/**
 * GET handler para obtener todos los registros de equipos en préstamo.
 */
export async function GET(request: Request) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const prestamos = await EquipoEnPrestamoService.getEquiposEnPrestamo(true);
    return NextResponse.json(prestamos, { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/equipos-en-prestamo:", error);
    return NextResponse.json(
      { message: "Error al obtener registros de préstamo" },
      { status: 500 }
    );
  }
}

/**
 * POST handler para crear un nuevo registro de equipo en préstamo.
 */
export async function POST(request: Request) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const data: EquipoEnPrestamoCreateInput = await request.json();
    const newPrestamo = await EquipoEnPrestamoService.createEquipoEnPrestamo(data);
    return NextResponse.json(newPrestamo, { status: 201 });
  } catch (error: any) {
    console.error("Error en POST /api/equipos-en-prestamo:", error);
    if (error?.message && error.message.startsWith('Error de validación')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    // Suponiendo que el servicio lanza un error con un mensaje específico para equipo no disponible
    if (error?.message && error.message.includes('no está disponible para préstamo')) {
        return NextResponse.json({ message: error.message }, { status: 409 }); // 409 Conflict
    }
    return NextResponse.json(
      { message: "Error al crear registro de préstamo" },
      { status: 500 }
    );
  }
}
