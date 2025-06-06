// src/app/api/tickets/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Obtener todos los tickets con filtros opcionales
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchText = searchParams.get("searchText") || "";
    const estado = searchParams.get("estado") || "";
    const prioridad = searchParams.get("prioridad") || "";

    // Construir la cláusula `where` para la consulta de Prisma
    const whereClause = {};

    // Filtrar por estado si se proporciona
    if (estado) {
      whereClause.estado = estado;
    }

    // Filtrar por prioridad si se proporciona
    if (prioridad) {
      whereClause.prioridad = prioridad;
    }

    // Aplicar búsqueda de texto si se proporciona
    if (searchText) {
      // NOTA IMPORTANTE: Se ha eliminado `mode: 'insensitive'` porque solo es compatible
      // con bases de datos PostgreSQL. Si estás usando SQLite (por ejemplo),
      // esta opción causará un error. La búsqueda será sensible a mayúsculas y minúsculas
      // a menos que tu base de datos o configuración de Prisma maneje la insensibilidad
      // de otra manera (ej. configurando la base de datos o usando LOWER() si es posible).
      whereClause.OR = [
        { titulo: { contains: searchText } },
        { descripcionDetallada: { contains: searchText } },
        // Para buscar por empresa y técnico, ahora accedemos a sus nombres si la relación está incluida
        { empresaCliente: { nombre: { contains: searchText } } },
        { solicitanteNombre: { contains: searchText } }, // solicitanteNombre ya es un string en Ticket
        { tecnicoAsignado: { name: { contains: searchText } } },
        // Convertir numeroCaso a string para buscar si es numérico
        { numeroCaso: { equals: parseInt(searchText) || undefined } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      orderBy: { numeroCaso: "desc" },
      // INICIO DE LA CORRECCIÓN: Incluir las relaciones necesarias
      include: {
        empresaCliente: {
          select: {
            id: true,
            nombre: true,
          },
        },
        ubicacion: {
          select: {
            id: true,
            nombreReferencial: true,
            direccionCompleta: true,
          },
        },
        tecnicoAsignado: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        // CORRECCIÓN: Incluir las acciones aquí para que aparezcan al seleccionar el ticket de la lista
        acciones: {
          orderBy: { fechaAccion: 'asc' }, // Ordenar acciones por fecha
          include: {
            realizadaPor: { // Incluir el usuario que realizó la acción
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      // FIN DE LA CORRECCIÓN
    });
    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error en GET /api/tickets:", error);
    // Verificar si 'error' es una instancia de Error antes de acceder a 'message'
    return NextResponse.json(
      { message: "Error al obtener tickets", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

// Crear un ticket (sin cambios, ya que esto se maneja principalmente por Server Actions)
export async function POST(request) {
  try {
    const dataFromFrontend = await request.json();

    const dataToSave = {
      numeroCaso: dataFromFrontend.nroCaso,
      // Los campos `empresa`, `ubicacion`, `tecnicoAsignado`, `solicitante` aquí
      // son los nombres de los campos directos que se esperan en el body del POST,
      // no los objetos de relación. Si el frontend envía IDs, Prisma los mapeará.
      // Sin embargo, si `dataFromFrontend.empresa` o `dataFromFrontend.ubicacion`
      // esperan ser los IDs de las relaciones, esta lógica debe ser revisada.
      // El Server Action `createNewTicketAction` ya maneja esto correctamente
      // usando `empresaClienteId` y `ubicacionId`.
      // Por lo tanto, esta ruta POST no necesita cambios para este problema específico.
      empresa: dataFromFrontend.empresa, // Esto debe ser `empresaClienteId` si proviene de un Select que envía IDs
      tipoIncidente: dataFromFrontend.tipo,
      ubicacion: dataFromFrontend.ubicacion, // Esto debe ser `ubicacionId` si proviene de un Select que envía IDs
      tecnicoAsignado: dataFromFrontend.tecnico, // Esto debe ser `tecnicoAsignadoId`
      solicitante: dataFromFrontend.contacto, // Esto debe ser `solicitanteNombre`
      titulo: dataFromFrontend.tituloDelTicket,
      descripcionDetallada: dataFromFrontend.detalleAdicional || null,
      prioridad: dataFromFrontend.prioridad,
      estado: dataFromFrontend.estado || "Abierto",
      acciones: Array.isArray(dataFromFrontend.acciones)
        ? JSON.stringify(dataFromFrontend.acciones)
        : dataFromFrontend.acciones || "[]",
      fechaCreacion: dataFromFrontend.createdAt ? new Date(dataFromFrontend.createdAt) : new Date(),
      fechaSolucion: dataFromFrontend.fechaSolucion ? new Date(dataFromFrontend.fechaSolucion) : null,
    };
    
    // NOTA: Esta ruta POST parece ser una versión antigua o alternativa.
    // El Server Action `createNewTicketAction` en `src/app/actions/ticketActions.ts`
    // ya maneja la creación de tickets y es el que está conectado al modal de creación.
    // Los campos `empresa`, `ubicacion`, `tecnicoAsignado`, `solicitante`
    // no coinciden con el modelo de Prisma `Ticket` actualizado,
    // el cual usa `empresaClienteId`, `ubicacionId`, `tecnicoAsignadoId`, `solicitanteNombre`.
    // Si esta ruta POST se sigue utilizando, necesitará ser actualizada para mapear
    // los datos del frontend a los campos correctos del modelo de Prisma.
    // Por ahora, solo se corrige el `GET`.
    if (!dataToSave.numeroCaso || !dataToSave.empresa || !dataToSave.prioridad || !dataToSave.tecnicoAsignado || !dataToSave.tipoIncidente || !dataToSave.titulo || !dataToSave.ubicacion || !dataToSave.solicitante || !dataToSave.fechaCreacion) {
        return NextResponse.json(
            { message: "Faltan campos obligatorios para crear el ticket." },
            { status: 400 }
        );
    }

    const newTicket = await prisma.ticket.create({
      data: dataToSave,
    });
    return NextResponse.json(newTicket, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/tickets:", error);
    return NextResponse.json(
      { message: "Error al crear ticket", error: error.message },
      { status: 400 }
    );
  }
}
