// RUTA: src/app/api/equipos/route.ts

import { EquipoInventarioService } from "@/services/equipoInventarioService";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ZodError } from "zod";
import { EquipoInventarioCreateInput } from "@/lib/validators/equipoInventarioValidator";
import { TipoEquipoInventario, EstadoEquipoInventario } from "@prisma/client";

/**
 * GET handler para obtener una lista de equipos.
 * Permite filtrar por estado del equipo y tipo de equipo mediante query parameters.
 * Ejemplo: /api/equipos?estado=DISPONIBLE&tipo=NOTEBOOK
 */
export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const estado = url.searchParams.get('estado') as EstadoEquipoInventario | null;
    // Opcional: podrías agregar filtro por tipo, sucursalId, etc.
    // const tipo = url.searchParams.get('tipo') as TipoEquipoInventario | null;

    let equipos;
    // Si se proporciona un estado válido, se filtra por él.
    // De lo contrario, el servicio podría tener un valor por defecto o devolver todos.
    if (estado && Object.values(EstadoEquipoInventario).includes(estado)) {
      equipos = await EquipoInventarioService.getEquipos(estado);
    } else {
      // Si no se especifica estado o es inválido, obtener todos los equipos por defecto del servicio.
      equipos = await EquipoInventarioService.getEquipos();
    }
    
    // Convertir fechas a ISO string para asegurar consistencia en la respuesta JSON
    const serializedEquipos = equipos.map(equipo => ({
      ...equipo,
      createdAt: equipo.createdAt.toISOString(),
      updatedAt: equipo.updatedAt.toISOString(),
      // Si fechaAdquisicion es Date o null, también serializarla
      fechaAdquisicion: equipo.fechaAdquisicion ? equipo.fechaAdquisicion.toISOString() : null,
    }));

    return NextResponse.json(serializedEquipos, { status: 200 });
  } catch (error: any) {
    console.error("Error en GET /api/equipos:", error);
    return NextResponse.json(
      { message: error.message || "Error al obtener equipos" },
      { status: 500 }
    );
  }
}

/**
 * POST handler para crear un nuevo equipo.
 */
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const data: EquipoInventarioCreateInput = await request.json();
    // La validación Zod se realiza en el servicio (o podrías hacerla aquí también).
    const newEquipo = await EquipoInventarioService.createEquipo(data);

    // Convertir fechas a ISO string para asegurar consistencia en la respuesta JSON
    const serializedEquipo = {
      ...newEquipo,
      createdAt: newEquipo.createdAt.toISOString(),
      updatedAt: newEquipo.updatedAt.toISOString(),
      fechaAdquisicion: newEquipo.fechaAdquisicion ? newEquipo.fechaAdquisicion.toISOString() : null,
    };

    return NextResponse.json(serializedEquipo, { status: 201 });
  } catch (error: any) {
    console.error("Error en POST /api/equipos:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: `Error de validación: ${error.errors.map(e => e.message).join(', ')}` }, { status: 400 });
    }
    return NextResponse.json(
      { message: error.message || "Error al crear equipo" },
      { status: 500 }
    );
  }
}
