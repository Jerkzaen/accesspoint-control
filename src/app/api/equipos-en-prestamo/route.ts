// RUTA: src/app/api/equipos-en-prestamo/route.ts

import { EquipoEnPrestamoService } from "@/services/equipoEnPrestamoService";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ZodError } from "zod";
import { EquipoEnPrestamoCreateInput, createEquipoEnPrestamoSchema } from "@/lib/validators/equipoEnPrestamoValidator";
import { EstadoPrestamoEquipo } from "@prisma/client";

/**
 * GET handler para obtener una lista de registros de equipos en préstamo.
 * Permite filtrar por estado del préstamo mediante query parameters.
 * Ejemplo: /api/equipos-en-prestamo?estado=PRESTADO
 */
export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const estado = url.searchParams.get('estado') as EstadoPrestamoEquipo | null;

    let prestamos;
    // Si se proporciona un estado válido, se filtra por él.
    if (estado && Object.values(EstadoPrestamoEquipo).includes(estado)) {
      // El servicio getEquiposEnPrestamo no tiene filtro por estado, solo includeRelations.
      // Si se necesita filtrar por estado, el servicio deberá ser actualizado o el filtrado aquí.
      // Por ahora, asumimos que getEquiposEnPrestamo obtiene todos y filtras aquí si es necesario.
      // O lo más ideal: actualizar el servicio para que acepte 'estado' como parámetro.
      // Para esta API, si el servicio no lo soporta, podrías hacer un get y luego un .filter()
      // O mejor aún, pasarlo al servicio si éste lo implementa (ideal).
      // Por simplicidad, por ahora llamo sin filtro y dejo el comentario.
      prestamos = await EquipoEnPrestamoService.getEquiposEnPrestamo(true); // Obtener con relaciones
      prestamos = prestamos.filter(p => p.estadoPrestamo === estado);
    } else {
      prestamos = await EquipoEnPrestamoService.getEquiposEnPrestamo(true); // Obtener todos con relaciones
    }
    
    // Convertir fechas a ISO string para asegurar consistencia en la respuesta JSON
    const serializedPrestamos = prestamos.map(prestamo => ({
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
    }));

    return NextResponse.json(serializedPrestamos, { status: 200 });
  } catch (error: any) {
    console.error("Error en GET /api/equipos-en-prestamo:", error);
    return NextResponse.json(
      { message: error.message || "Error al obtener registros de préstamo" },
      { status: 500 }
    );
  }
}

/**
 * POST handler para crear un nuevo registro de préstamo de equipo.
 */
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const rawData = await request.json();
    
    // Validar los datos con Zod antes de procesar
    let validatedData: EquipoEnPrestamoCreateInput;
    try {
      validatedData = createEquipoEnPrestamoSchema.parse(rawData);
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        return NextResponse.json({ 
          message: `Error de validación: ${validationError.errors.map(e => e.message).join(', ')}` 
        }, { status: 400 });
      }
      throw validationError;
    }
    
    // Crear el préstamo con datos validados
    try {
      const newPrestamo = await EquipoEnPrestamoService.createEquipoEnPrestamo(validatedData);

      // Convertir fechas a ISO string para asegurar consistencia en la respuesta JSON
      const serializedPrestamo = {
        ...newPrestamo,
        fechaPrestamo: newPrestamo.fechaPrestamo.toISOString(),
        fechaDevolucionEstimada: newPrestamo.fechaDevolucionEstimada.toISOString(),
        fechaDevolucionReal: newPrestamo.fechaDevolucionReal ? newPrestamo.fechaDevolucionReal.toISOString() : null,
        createdAt: newPrestamo.createdAt.toISOString(),
        updatedAt: newPrestamo.updatedAt.toISOString(),
      };

      return NextResponse.json(serializedPrestamo, { status: 201 });
    } catch (serviceError: any) {
      // Manejar errores específicos del negocio
      if (serviceError.message?.includes('no está disponible para préstamo') || 
          serviceError.message?.includes('no disponible') ||
          serviceError.message?.includes('ya está prestado')) {
        return NextResponse.json({ message: serviceError.message }, { status: 409 });
      }
      
      if (serviceError.message?.includes('no encontrado') || 
          serviceError.message?.includes('No se encontró')) {
        return NextResponse.json({ message: serviceError.message }, { status: 404 });
      }
      
      // Re-lanzar el error para que sea manejado por el catch externo
      throw serviceError;
    }
    
  } catch (error: any) {
    console.error("Error en POST /api/equipos-en-prestamo:", error);
    return NextResponse.json(
      { message: error.message || "Error al crear registro de préstamo" },
      { status: 500 }
    );
  }
}
