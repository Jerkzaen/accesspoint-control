// src/app/api/admin/importar-tickets/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { RoleUsuario, EstadoTicket, PrioridadTicket } from "@prisma/client";
import { z } from "zod";

// Define el tipo de usuario esperado en la sesión
interface SessionUser {
  id: string;
  rol?: RoleUsuario;
}

// Define el esquema de validación para una fila del CSV usando Zod
const ticketCsvRowSchema = z.object({
  titulo: z.string().min(1, "El título es obligatorio."),
  descripcionDetallada: z.string().optional(),
  tipoIncidente: z.string().min(1, "El tipo de incidente es obligatorio."),
  prioridad: z.nativeEnum(PrioridadTicket, { errorMap: () => ({ message: "Prioridad inválida." }) }),
  estado: z.nativeEnum(EstadoTicket, { errorMap: () => ({ message: "Estado inválido." }) }),
  solicitanteNombre: z.string().min(1, "El nombre del solicitante es obligatorio."),
  solicitanteTelefono: z.string().optional(),
  solicitanteCorreo: z.string().email("Correo del solicitante inválido.").optional().or(z.literal('')),
  empresaClienteNombre: z.string().optional(),
  tecnicoAsignadoEmail: z.string().email("Email del técnico inválido.").optional().or(z.literal('')),
  fechaCreacion: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Formato de fecha de creación inválido." }),
  fechaSolucionEstimada: z.string().refine((val) => val === '' || !isNaN(Date.parse(val)), { message: "Formato de fecha de solución estimada inválido." }).optional(),
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
  const errors: { row: number; data: TicketCsvRow; error: string }[] = [];
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

    // 4. Procesamiento en una única transacción
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const rowIndex = i + 1;

        const validation = ticketCsvRowSchema.safeParse(record);
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
          errors.push({ row: rowIndex, data: record, error: `La empresa '${empresaClienteNombre}' no fue encontrada.` });
          continue;
        }

        const tecnicoAsignadoId = tecnicoAsignadoEmail ? tecnicoMap.get(tecnicoAsignadoEmail.toLowerCase()) : null;
        if (tecnicoAsignadoEmail && !tecnicoAsignadoId) {
          errors.push({ row: rowIndex, data: record, error: `El técnico con email '${tecnicoAsignadoEmail}' no fue encontrado.` });
          continue;
        }

        currentNumeroCaso++;
        await tx.ticket.create({
          data: {
            ...ticketData,
            numeroCaso: currentNumeroCaso,
            fechaCreacion: new Date(ticketData.fechaCreacion),
            fechaSolucionEstimada: ticketData.fechaSolucionEstimada ? new Date(ticketData.fechaSolucionEstimada) : null,
            empresaClienteId: empresaClienteId,
            tecnicoAsignadoId: tecnicoAsignadoId || user.id,
          },
        });
        successfulCount++;
      }

      if (errors.length > 0) {
         throw new Error(`Procesamiento parcial: ${errors.length} de ${records.length} filas tuvieron errores. Rollback iniciado.`);
      }
    });

    // 5. Envío de respuesta exitosa
    return NextResponse.json({
        message: "Proceso de importación finalizado con éxito.",
        successfulCount: successfulCount,
        failedCount: errors.length,
        errors: errors,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error en la importación masiva de tickets:", error);
    return NextResponse.json({
      message: error.message || "Error catastrófico durante la transacción. No se importó ningún ticket.",
      successfulCount: 0,
      failedCount: records.length,
      errors: errors.length > 0 ? errors : [{ row: 0, data: {} as any, error: error.message }],
    }, { status: 500 });
  }
}
