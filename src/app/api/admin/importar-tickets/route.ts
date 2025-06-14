// src/app/api/admin/importar-tickets/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { RoleUsuario, EstadoTicket, PrioridadTicket } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from 'next/cache';

// Define el tipo de usuario esperado en la sesión para mayor seguridad de tipos.
interface SessionUser {
  id: string;
  rol?: RoleUsuario;
}

// Define el esquema de validación para cada fila que viene del frontend usando Zod.
// Esto asegura que los datos son correctos antes de intentar guardarlos.
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
  // 1. Verificación de sesión y rol de administrador.
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (!user || user.rol !== RoleUsuario.ADMIN) {
    return NextResponse.json({ message: "Acceso denegado. Se requiere rol de Administrador." }, { status: 403 });
  }

  // 2. Recepción y validación del cuerpo de la solicitud (se espera un JSON).
  let records: TicketCsvRow[];
  try {
    records = await request.json();
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ message: "No se proporcionaron registros o el formato es incorrecto." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ message: "Error al parsear el cuerpo de la solicitud JSON." }, { status: 400 });
  }

  const errors: { row: number; data: any; error: string }[] = [];
  let successfulCount = 0;

  try {
    // 3. Optimización: Pre-cargamos en memoria los datos que se consultarán repetidamente.
    const [empresas, tecnicos, lastTicket] = await Promise.all([
      prisma.empresaCliente.findMany({ select: { id: true, nombre: true } }),
      prisma.user.findMany({ where: { rol: 'TECNICO' }, select: { id: true, email: true } }),
      prisma.ticket.findFirst({ orderBy: { numeroCaso: 'desc' }, select: { numeroCaso: true } })
    ]);

    const empresaMap = new Map(empresas.map(e => [e.nombre.toLowerCase(), e.id]));
    const tecnicoMap = new Map(tecnicos.map(t => [t.email?.toLowerCase(), t.id]));
    let currentNumeroCaso = lastTicket?.numeroCaso || 0;

    // 4. Lógica de Negocio dentro de una Transacción Atómica.
    // O todo se guarda, o no se guarda nada. Esto previene datos corruptos.
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const rowIndex = i + 2; // Simula la línea en el CSV para los mensajes de error.

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

        // Búsqueda de IDs relacionados
        const empresaClienteId = empresaClienteNombre ? empresaMap.get(empresaClienteNombre.toLowerCase()) : null;
        if (empresaClienteNombre && !empresaClienteId) {
          errors.push({ row: rowIndex, data: record, error: `La empresa '${empresaClienteNombre}' no fue encontrada.` });
          continue;
        }

        const tecnicoAsignadoId = tecnicoAsignadoEmail ? tecnicoMap.get(tecnicoAsignadoEmail.toLowerCase()) : null;
        if (tecnicoAsignadoEmail && !tecnicoAsignadoId) {
          errors.push({ row: rowIndex, data: record, error: `El técnico con email '${tecnicoAsignadoEmail}' no fue encontrado.` });
          // Opcional: podrías decidir continuar y asignar al usuario actual.
        }
        
        const finalTecnicoAsignadoId = tecnicoAsignadoId || user.id;

        currentNumeroCaso++;

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
      }

      // Si se encuentra CUALQUIER error durante la validación, se lanza un error
      // para revertir (rollback) toda la transacción.
      if (errors.length > 0) {
         const detailedErrorMessage = JSON.stringify({
            message: "Se encontraron errores de validación. La importación fue cancelada y revertida.",
            detailedErrors: errors,
         });
         throw new Error(detailedErrorMessage);
      }
    });

    // 5. REVALIDACIÓN DE CACHÉ (LA SOLUCIÓN CLAVE)
    // Si llegamos aquí, la transacción fue exitosa.
    // Le ordenamos a Next.js que borre el caché de estas páginas.
    // La próxima vez que un usuario las visite, Next.js las generará de nuevo con los datos actualizados.
    console.log("Transacción exitosa. Revalidando rutas...");
    revalidatePath('/tickets/dashboard'); // Revalida la página principal del dashboard.
    revalidatePath('/tickets'); // Revalida la ruta base de tickets por si hay layouts cacheados.
    revalidatePath('/'); // Revalida la página de inicio por si muestra algún contador o resumen.


    // 6. Envío de respuesta exitosa al cliente.
    return NextResponse.json({
        message: "Proceso de importación finalizado con éxito.",
        successfulCount: successfulCount,
        failedCount: 0,
        errors: [],
    }, { status: 200 });

  } catch (error: any) {
    // 7. Manejo de Errores y Rollback.
    // Este bloque se ejecuta si la transacción falla.
    let mainMessage = "Error durante la transacción. No se importó ningún ticket.";
    let finalErrorsArray = errors; // Errores de validación que causaron el rollback.

    // Intenta parsear el error por si es el que lanzamos nosotros con detalles.
    try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.message && parsedError.detailedErrors) {
            mainMessage = parsedError.message;
            finalErrorsArray = parsedError.detailedErrors;
        }
    } catch (parseError) {
       // Si no es nuestro error JSON, es un error de base de datos u otro.
       mainMessage = "Error inesperado en la base de datos durante la transacción. Se ha realizado un rollback.";
       console.error("Error de importación (catch principal):", error.message);
    }
    
    // Logueamos los errores en el servidor para depuración.
    console.warn("Rollback de Importación de Tickets:", mainMessage);
    if (finalErrorsArray.length > 0) {
        console.table(finalErrorsArray.map(err => ({ Línea: err.row, Error: err.error, Datos: JSON.stringify(err.data).substring(0, 80) + '...' })));
    }
    
    // Si el array de errores está vacío pero aún así hubo un error, añadimos un error genérico.
    if (finalErrorsArray.length === 0) {
      finalErrorsArray.push({ row: 0, data: {}, error: mainMessage });
    }

    return NextResponse.json({
      message: mainMessage,
      successfulCount: 0,
      failedCount: records.length,
      errors: finalErrorsArray,
    }, { status: 400 }); // Usamos 400 (Bad Request) ya que usualmente es por datos inválidos.
  }
}
