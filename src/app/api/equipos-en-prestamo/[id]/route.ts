// RUTA: src/app/api/equipos-en-prestamo/[id]/route.ts

import { EquipoEnPrestamoService } from "@/services/equipoEnPrestamoService";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ZodError } from "zod";
import { EquipoEnPrestamoUpdateInput, updateEquipoEnPrestamoSchema } from "@/lib/validators/equipoEnPrestamoValidator";
import { EstadoPrestamoEquipo } from "@prisma/client";
import { Prisma } from "@prisma/client"; // Necesario para errores de Prisma

/**
 * GET handler para obtener un registro de préstamo por su ID.
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
    const prestamo = await EquipoEnPrestamoService.getEquipoEnPrestamoById(params.id);
    if (!prestamo) {
      return NextResponse.json({ message: "Registro de préstamo no encontrado" }, { status: 404 });
    }

    // Convertir fechas a ISO string para asegurar consistencia en la respuesta JSON
    const serializedPrestamo = {
      ...prestamo,
      fechaPrestamo: prestamo.fechaPrestamo.toISOString(),
      fechaDevolucionEstimada: prestamo.fechaDevolucionEstimada.toISOString(),
      fechaDevolucionReal: prestamo.fechaDevolucionReal ? prestamo.fechaDevolucionReal.toISOString() : null,
      createdAt: prestamo.createdAt.toISOString(),
      updatedAt: prestamo.updatedAt.toISOString(),
      // Serializar fechas en relaciones anidadas si se incluyen
      equipo: prestamo.equipo ? {
        ...prestamo.equipo,
        createdAt: prestamo.equipo.createdAt.toISOString(),
        updatedAt: prestamo.equipo.updatedAt.toISOString(),
        fechaAdquisicion: prestamo.equipo.fechaAdquisicion ? prestamo.equipo.fechaAdquisicion.toISOString() : null,
      } : null,
      prestadoAContacto: prestamo.prestadoAContacto ? {
        ...prestamo.prestadoAContacto,
        createdAt: prestamo.prestadoAContacto.createdAt.toISOString(),
        updatedAt: prestamo.prestadoAContacto.updatedAt.toISOString(),
      } : null,
      ticketAsociado: prestamo.ticketAsociado ? {
        ...prestamo.ticketAsociado,
        fechaCreacion: prestamo.ticketAsociado.fechaCreacion.toISOString(),
        updatedAt: prestamo.ticketAsociado.updatedAt.toISOString(),
        fechaSolucionEstimada: prestamo.ticketAsociado.fechaSolucionEstimada ? prestamo.ticketAsociado.fechaSolucionEstimada.toISOString() : null,
        fechaSolucionReal: prestamo.ticketAsociado.fechaSolucionReal ? prestamo.ticketAsociado.fechaSolucionReal.toISOString() : null,
      } : null,
      entregadoPorUsuario: prestamo.entregadoPorUsuario ? {
        ...prestamo.entregadoPorUsuario,
        createdAt: prestamo.entregadoPorUsuario.createdAt.toISOString(),
        updatedAt: prestamo.entregadoPorUsuario.updatedAt.toISOString(),
      } : null,
      recibidoPorUsuario: prestamo.recibidoPorUsuario ? {
        ...prestamo.recibidoPorUsuario,
        createdAt: prestamo.recibidoPorUsuario.createdAt.toISOString(),
        updatedAt: prestamo.recibidoPorUsuario.updatedAt.toISOString(),
      } : null,
    };

    return NextResponse.json(serializedPrestamo, { status: 200 });
  } catch (error: any) {
    console.error(`Error en GET /api/equipos-en-prestamo/${params.id}:`, error);
    return NextResponse.json(
      { message: error.message || "Error al obtener registro de préstamo" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler para actualizar un registro de préstamo existente.
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
    const rawData = await request.json();
    
    // Validar los datos con Zod antes de procesar
    let validatedData: EquipoEnPrestamoUpdateInput;
    try {
      validatedData = updateEquipoEnPrestamoSchema.parse(rawData);
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        return NextResponse.json({ 
          message: `Error de validación: ${validationError.errors.map(e => e.message).join(', ')}` 
        }, { status: 400 });
      }
      throw validationError;
    }
    
    try {
      const updatedPrestamo = await EquipoEnPrestamoService.updateEquipoEnPrestamo(params.id, validatedData);

      // Convertir fechas a ISO string
      const serializedPrestamo = {
        ...updatedPrestamo,
        fechaPrestamo: updatedPrestamo.fechaPrestamo.toISOString(),
        fechaDevolucionEstimada: updatedPrestamo.fechaDevolucionEstimada.toISOString(),
        fechaDevolucionReal: updatedPrestamo.fechaDevolucionReal ? updatedPrestamo.fechaDevolucionReal.toISOString() : null,
        createdAt: updatedPrestamo.createdAt.toISOString(),
        updatedAt: updatedPrestamo.updatedAt.toISOString(),
      };

      return NextResponse.json(serializedPrestamo, { status: 200 });
    } catch (serviceError: any) {
      // Manejar errores específicos del negocio
      if (serviceError.message?.includes('no está disponible para préstamo') || 
          serviceError.message?.includes('no disponible') ||
          serviceError.message?.includes('ya está prestado')) {
        return NextResponse.json({ message: serviceError.message }, { status: 409 });
      }
      
      if (serviceError.message.includes('Registro de préstamo no encontrado para actualizar.')) {
        return NextResponse.json({ message: serviceError.message }, { status: 404 });
      }
      
      // Re-lanzar el error para que sea manejado por el catch externo
      throw serviceError;
    }
    
  } catch (error: any) {
    console.error(`Error en PUT /api/equipos-en-prestamo/${params.id}:`, error);
    return NextResponse.json(
      { message: error.message || "Error al actualizar registro de préstamo" },
      { status: 500 }
    );
  }
}

// NOTE: Para el DELETE físico, el servicio tiene deleteEquipoEnPrestamo, pero la política es no eliminar físicamente desde la API.
// Si se requiere un hard delete, se podría añadir una ruta y permisos muy restringidos.
// Por ahora, solo se expone la desactivación (finalización).

// NOTE: La función POST_Finalizar debería estar en una ruta separada como /api/equipos-en-prestamo/[id]/finalizar
// por ahora se comenta esta función hasta que se cree la ruta específica.
