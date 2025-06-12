// src/app/api/admin/importar-tickets/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { RoleUsuario, EstadoTicket, PrioridadTicket } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from 'next/cache'; // Importamos revalidatePath

// Define el tipo de usuario esperado en la sesión
interface SessionUser {
  id: string;
  rol?: RoleUsuario;
}

// Define el esquema de validación para una fila del CSV usando Zod
const ticketCsvRowSchema = z.object({
  titulo: z.string().min(1, "El título es obligatorio."),
  descripcionDetallada: z.string().optional().nullable(),
  tipoIncidente: z.string().min(1, "El tipo de incidente es obligatorio."),
  prioridad: z.nativeEnum(PrioridadTicket, { errorMap: () => ({ message: "Prioridad inválida. Valores permitidos: BAJA, MEDIA, ALTA, URGENTE." }) }),
  estado: z.nativeEnum(EstadoTicket, { errorMap: () => ({ message: "Estado inválido. Valores permitidos: ABIERTO, CERRADO, EN_PROGRESO, PENDIENTE_TERCERO, PENDIENTE_CLIENTE, RESUELTO, CANCELADO." }) }),
  solicitanteNombre: z.string().min(1, "El nombre del solicitante es obligatorio."),
  solicitanteTelefono: z.string().optional().nullable(),
  solicitanteCorreo: z.string().email("Correo del solicitante inválido.").optional().or(z.literal('')).nullable(),
  empresaClienteNombre: z.string().optional().nullable(),
  tecnicoAsignadoEmail: z.string().email("Email del técnico inválido.").optional().or(z.literal('')).nullable(),
  fechaCreacion: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Formato de fecha de creación inválido (YYYY-MM-DD HH:MM:SS)." }),
  fechaSolucionEstimada: z.string().refine((val) => val === '' || val === null || !isNaN(Date.parse(val)), { message: "Formato de fecha de solución estimada inválido (YYYY-MM-DD)." }).optional().nullable(),
});

type TicketCsvRow = z.infer<typeof ticketCsvRowSchema>;

export async function POST(request: NextRequest) {
  // 1. Verificación de sesión y rol de administrador
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (!user || user.rol !== RoleUsuario.ADMIN) {
    return NextResponse.json({ message: "Acceso denegado. Se requiere rol de Administrador." }, { status: 403 });
  }

  // 2. Recepción y validación del cuerpo de la solicitud
  let records: TicketCsvRow[];
  try {
    records = await request.json();
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ message: "No se proporcionaron registros o el formato es incorrecto." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ message: "Error al parsear el cuerpo de la solicitud." }, { status: 400 });
  }

  // 3. Preparación de datos para la transacción
  const errors: { row: number; data: any; error: string }[] = []; 
  let successfulCount = 0;

  try {
    // Optimización: Pre-cargar datos necesarios
    const [empresas, tecnicos, lastTicket] = await Promise.all([
      prisma.empresaCliente.findMany({ select: { id: true, nombre: true } }),
      prisma.user.findMany({ where: { rol: 'TECNICO' }, select: { id: true, email: true } }),
      prisma.ticket.findFirst({ orderBy: { numeroCaso: 'desc' }, select: { numeroCaso: true } })
    ]);

    const empresaMap = new Map(empresas.map(e => [e.nombre.toLowerCase(), e.id]));
    const tecnicoMap = new Map(tecnicos.map(t => [t.email?.toLowerCase(), t.id]));
    let currentNumeroCaso = lastTicket?.numeroCaso || 0;

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const rowIndex = i + 2; // Línea en el CSV, +1 por encabezado, +1 por índice base 0
        
        const cleanedRecord = Object.fromEntries(
          Object.entries(record as Record<string, unknown>).map(([key, value]) => [key, value === '' ? null : value])
        ) as TicketCsvRow;

        const validation = ticketCsvRowSchema.safeParse(cleanedRecord);
        if (!validation.success) {
          errors.push({ row: rowIndex, data: record, error: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') });
          continue;
        }

        const {
            empresaClienteNombre,
            tecnicoAsignadoEmail,
            ...ticketData
        } = validation.data;

        const empresaClienteId = empresaClienteNombre ? empresaMap.get(empresaClienteNombre.toLowerCase()) : null;
        if (empresaClienteNombre && !empresaClienteId) {
          errors.push({ row: rowIndex, data: record, error: `La empresa '${empresaClienteNombre}' no fue encontrada en la base de datos.` });
          continue;
        }

        const tecnicoAsignadoId = tecnicoAsignadoEmail ? tecnicoMap.get(tecnicoAsignadoEmail.toLowerCase()) : null;
        const finalTecnicoAsignadoId = tecnicoAsignadoId || user.id; 
        if (tecnicoAsignadoEmail && !tecnicoAsignadoId) {
          errors.push({ row: rowIndex, data: record, error: `El técnico con email '${tecnicoAsignadoEmail}' no fue encontrado en la base de datos. Se asignará al usuario de carga.` });
        }

        currentNumeroCaso++;
        
        try {
            await tx.ticket.create({
                data: {
                    ...ticketData,
                    numeroCaso: currentNumeroCaso,
                    fechaCreacion: new Date(ticketData.fechaCreacion),
                    fechaSolucionEstimada: ticketData.fechaSolucionEstimada ? new Date(ticketData.fechaSolucionEstimada) : null,
                    empresaClienteId: empresaClienteId,
                    tecnicoAsignadoId: finalTecnicoAsignadoId,
                },
            });
            successfulCount++;
        } catch (dbError: any) {
            let errorMessage = `Error al insertar en la base de datos: ${dbError.message}`;
            if (dbError.code === 'P2002') {
                errorMessage = `Error de clave única (ej. número de caso ${currentNumeroCaso} duplicado o email de solicitante/contacto ya existe).`;
            } else if (dbError.code === 'P2003') {
                errorMessage = `Fallo de relación.`; 
            }
            errors.push({ row: rowIndex, data: record, error: errorMessage });
        }
      }

      // Si hay CUALQUIER error (ya sea de validación Zod o de DB), forzamos un rollback completo
      if (errors.length > 0) {
         const detailedErrorMessage = JSON.stringify({
            message: "Se encontraron errores durante la importación. Se ha realizado un rollback completo.",
            detailedErrors: errors, 
         });
         throw new Error(detailedErrorMessage);
      }
    });

    // 5. Envío de respuesta exitosa
    // Si llegamos aquí, la transacción fue exitosa y no hubo errores que forzaran el rollback.
    revalidatePath('/tickets/dashboard'); // <-- ¡Añadido aquí!

    return NextResponse.json({
        message: "Proceso de importación finalizado con éxito.",
        successfulCount: successfulCount,
        failedCount: errors.length, 
        errors: errors, 
    }, { status: 200 });

  } catch (error: any) {
    let mainMessage = "Error catastrófico durante la transacción. No se importó ningún ticket.";
    let finalErrorsArray = errors;

    try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.message && parsedError.detailedErrors) {
            mainMessage = parsedError.message;
            finalErrorsArray = parsedError.detailedErrors;
        } else {
            mainMessage = error.message; 
        }
    } catch (parseError) {
        mainMessage = error.message;
    }

    console.warn("Advertencia de Importación de Tickets (Rollback):", mainMessage);
    if (finalErrorsArray.length > 0) {
        console.table(finalErrorsArray.map(err => ({ 
            Línea: err.row, 
            Error: err.error, 
            Datos: JSON.stringify(err.data).substring(0, 100) + '...'
        })));
    } else {
        console.warn("No se encontraron errores detallados específicos para el log. Mensaje general:", mainMessage);
    }

    if (finalErrorsArray.length === 0) {
        finalErrorsArray.push({ 
            row: 0, 
            data: {}, 
            error: mainMessage,
        });
    }

    return NextResponse.json({
      message: mainMessage,
      successfulCount: 0, 
      failedCount: records.length, 
      errors: finalErrorsArray, 
    }, { status: 500 }); 
  }
}
