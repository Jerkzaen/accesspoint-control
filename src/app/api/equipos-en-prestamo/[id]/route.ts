// src/app/api/equipos-en-prestamo/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { EquipoEnPrestamoService, EquipoEnPrestamoUpdateInput } from "@/services/equipoEnPrestamoService";
import { serializeDates } from "@/lib/utils"; // Importar la utilidad de serialización

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const prestamo = await EquipoEnPrestamoService.getEquipoEnPrestamoById(id);
    if (!prestamo) {
      return new Response(JSON.stringify({ message: "Registro de préstamo no encontrado" }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(serializeDates(prestamo)), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error(`Error en GET /api/equipos-en-prestamo/${params.id}:`, error);
    return new Response(
      JSON.stringify({ message: "Error al obtener registro de préstamo", error: error?.message || "Error desconocido" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    let data: EquipoEnPrestamoUpdateInput = await request.json();
    // Convertir fechas de string a Date si es necesario
    if (typeof data.fechaDevolucionEstimada === 'string') {
      data.fechaDevolucionEstimada = new Date(data.fechaDevolucionEstimada);
    }
    if (typeof data.fechaDevolucionReal === 'string') {
      data.fechaDevolucionReal = new Date(data.fechaDevolucionReal);
    }
    const updatedPrestamo = await EquipoEnPrestamoService.updateEquipoEnPrestamo({ ...data, id });
    return new Response(JSON.stringify(serializeDates(updatedPrestamo)), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error(`Error en PUT /api/equipos-en-prestamo/${params.id}:`, error);
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
      JSON.stringify({ message: "Error al actualizar registro de préstamo", error: error?.message || "Error desconocido" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const result = await EquipoEnPrestamoService.deleteEquipoEnPrestamo(id);
    // El servicio devuelve void en caso de éxito, así que el mensaje es fijo
    return new Response(JSON.stringify({ message: "Registro de préstamo eliminado exitosamente" }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error(`Error en DELETE /api/equipos-en-prestamo/${params.id}:`, error);
    if (error?.message && error.message.startsWith('Error de validación')) {
      return new Response(
        JSON.stringify({ message: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ message: "Error al eliminar registro de préstamo", error: error?.message || "Error desconocido" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
