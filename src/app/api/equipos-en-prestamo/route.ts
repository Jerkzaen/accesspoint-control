// src/app/api/equipos-en-prestamo/route.ts

import { NextRequest, NextResponse } from "next/server";
import { EquipoEnPrestamoService, EquipoEnPrestamoCreateInput } from "@/services/equipoEnPrestamoService";
import { Prisma } from "@prisma/client";
import { serializeDates } from "@/lib/utils"; // Importar la utilidad de serialización

/**
 * GET handler para obtener todos los registros de equipos en préstamo.
 * @param request El objeto de solicitud de Next.js.
 * @returns Una respuesta JSON con la lista de préstamos o un mensaje de error.
 */
export async function GET(request: NextRequest) {
  try {
    const prestamos = await EquipoEnPrestamoService.getEquiposEnPrestamo(true); // Incluir relaciones para la visualización
    return new Response(JSON.stringify(serializeDates(prestamos)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error en GET /api/equipos-en-prestamo:", error);
    return new Response(
      JSON.stringify({ message: "Error al obtener registros de préstamo", error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST handler para crear un nuevo registro de equipo en préstamo.
 * @param request El objeto de solicitud de Next.js.
 * @returns Una respuesta JSON con el préstamo creado o un mensaje de error.
 */
export async function POST(request: NextRequest) {
  try {
    let data: EquipoEnPrestamoCreateInput = await request.json();
    // Convertir fechas de string a Date si es necesario
    if (typeof data.fechaDevolucionEstimada === 'string') {
      data.fechaDevolucionEstimada = new Date(data.fechaDevolucionEstimada);
    }
    const newPrestamo = await EquipoEnPrestamoService.createEquipoEnPrestamo(data);
    return new Response(JSON.stringify(serializeDates(newPrestamo)), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("Error en POST /api/equipos-en-prestamo:", error);
    // Manejo de error de validación por mensaje
    if (error?.message && error.message.startsWith('Error de validación')) {
      return new Response(
        JSON.stringify({ message: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (error?.code === 'P2002') {
      return new Response(
        JSON.stringify({ message: "Ya existe un registro con los mismos datos únicos" }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ message: "Error al crear registro de préstamo", error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

