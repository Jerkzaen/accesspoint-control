// RUTA: src/app/api/equipos/[id]/route.ts

import { EquipoInventarioService } from "@/services/equipoInventarioService";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ZodError } from "zod";
import { EquipoInventarioUpdateInput } from "@/lib/validators/equipoInventarioValidator";
import { Prisma } from "@prisma/client";

/**
 * GET handler para obtener un equipo por su ID.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const equipo = await EquipoInventarioService.getEquipoById(params.id);
    if (!equipo) {
      return NextResponse.json({ message: "Equipo no encontrado" }, { status: 404 });
    }

    // Convertir fechas a ISO string para asegurar consistencia en la respuesta JSON
    const serializedEquipo = {
      ...equipo,
      createdAt: equipo.createdAt.toISOString(),
      updatedAt: equipo.updatedAt.toISOString(),
      fechaAdquisicion: equipo.fechaAdquisicion ? equipo.fechaAdquisicion.toISOString() : null,
      // Manejar serialización de fechas en relaciones si se incluyen
      ubicacionActual: equipo.ubicacionActual ? {
        ...equipo.ubicacionActual,
        createdAt: equipo.ubicacionActual.createdAt.toISOString(),
        updatedAt: equipo.ubicacionActual.updatedAt.toISOString(),
      } : null,
      empresa: equipo.empresa ? {
        ...equipo.empresa,
        createdAt: equipo.empresa.createdAt.toISOString(),
        updatedAt: equipo.empresa.updatedAt.toISOString(),
      } : null,
      parentEquipo: equipo.parentEquipo ? {
        ...equipo.parentEquipo,
        createdAt: equipo.parentEquipo.createdAt.toISOString(),
        updatedAt: equipo.parentEquipo.updatedAt.toISOString(),
        fechaAdquisicion: equipo.parentEquipo.fechaAdquisicion ? equipo.parentEquipo.fechaAdquisicion.toISOString() : null,
      } : null,
      // Simplificar componentes para evitar recursión infinita - solo incluir info básica
      componentes: equipo.componentes ? equipo.componentes.map(comp => ({
        id: comp.id,
        nombreDescriptivo: comp.nombreDescriptivo,
        identificadorUnico: comp.identificadorUnico,
        tipoEquipo: comp.tipoEquipo,
        estadoEquipo: comp.estadoEquipo,
        marca: comp.marca,
        modelo: comp.modelo,
        createdAt: comp.createdAt.toISOString(),
        updatedAt: comp.updatedAt.toISOString(),
        fechaAdquisicion: comp.fechaAdquisicion ? comp.fechaAdquisicion.toISOString() : null,
      })) : [],
      // Para préstamos, también serializar fechas
      prestamos: equipo.prestamos ? equipo.prestamos.map(prestamo => ({
        ...prestamo,
        fechaPrestamo: prestamo.fechaPrestamo.toISOString(),
        fechaDevolucionEstimada: prestamo.fechaDevolucionEstimada.toISOString(),
        fechaDevolucionReal: prestamo.fechaDevolucionReal ? prestamo.fechaDevolucionReal.toISOString() : null,
        createdAt: prestamo.createdAt.toISOString(),
        updatedAt: prestamo.updatedAt.toISOString(),
      })) : [],
    };

    return NextResponse.json(serializedEquipo, { status: 200 });
  } catch (error: any) {
    console.error(`Error en GET /api/equipos/${params.id}:`, error);
    return NextResponse.json(
      { message: error.message || "Error al obtener equipo" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler para actualizar un equipo existente.
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const data: EquipoInventarioUpdateInput = await request.json();
    const updatedEquipo = await EquipoInventarioService.updateEquipo(params.id, data);

    // Convertir fechas a ISO string para asegurar consistencia en la respuesta JSON
    const serializedEquipo = {
      ...updatedEquipo,
      createdAt: updatedEquipo.createdAt.toISOString(),
      updatedAt: updatedEquipo.updatedAt.toISOString(),
      fechaAdquisicion: updatedEquipo.fechaAdquisicion ? updatedEquipo.fechaAdquisicion.toISOString() : null,
    };

    return NextResponse.json(serializedEquipo, { status: 200 });
  } catch (error: any) {
    console.error(`Error en PUT /api/equipos/${params.id}:`, error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: `Error de validación: ${error.errors.map(e => e.message).join(', ')}` }, { status: 400 });
    }
    if (error.message.includes('Equipo no encontrado para actualizar.')) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { message: error.message || "Error al actualizar equipo" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler para desactivar un equipo (no eliminarlo físicamente).
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const deactivatedEquipo = await EquipoInventarioService.deactivateEquipo(params.id);

    // Convertir fechas a ISO string
    const serializedEquipo = {
      ...deactivatedEquipo,
      createdAt: deactivatedEquipo.createdAt.toISOString(),
      updatedAt: deactivatedEquipo.updatedAt.toISOString(),
      fechaAdquisicion: deactivatedEquipo.fechaAdquisicion ? deactivatedEquipo.fechaAdquisicion.toISOString() : null,
    };

    return NextResponse.json({ message: "Equipo desactivado exitosamente", equipo: serializedEquipo }, { status: 200 });
  } catch (error: any) {
    console.error(`Error en DELETE /api/equipos/${params.id} (deactivate):`, error);
    if (error.message.includes('Equipo no encontrado para desactivar.')) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error.message.includes('No se puede dar de baja un equipo que está prestado.')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    // Manejo específico para constraint de foreign key (equipos con elementos asociados)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json({ message: 'No se puede desactivar el equipo debido a elementos asociados (préstamos, tickets).' }, { status: 400 });
    }
    if (error.message.includes('No se puede desactivar el equipo debido a elementos asociados')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: error.message || "Error al desactivar equipo" },
      { status: 500 }
    );
  }
}
