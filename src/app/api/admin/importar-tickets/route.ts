// RUTA: src/app/api/admin/importar-tickets/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { RoleUsuario, EstadoTicket, PrioridadTicket } from "@prisma/client";
import { revalidatePath } from 'next/cache';

// Tipos para el manejo de datos
interface CsvRow {
    tipo_registro: 'TICKET' | 'ACCION';
    numero_ticket_asociado: string;
    titulo?: string;
    descripcionDetallada?: string;
    tipoIncidente?: string;
    prioridad?: string;
    estado?: string;
    solicitanteNombre?: string;
    solicitanteTelefono?: string;
    solicitanteCorreo?: string;
    empresaClienteNombre?: string;
    tecnicoAsignadoEmail?: string;
    ubicacionNombre?: string; // Este es el nombre de la SUCURSAL
    fechaCreacion?: string;
    fechaSolucionReal?: string;
    accion_descripcion?: string;
    accion_fecha?: string;
    accion_usuario_email?: string;
    accion_categoria?: string;
    equipo_afectado?: string;
}

interface ProcessingError {
    row: number;
    error: string;
    data: any;
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id: string; rol: RoleUsuario } | undefined;

    if (!user || user.rol !== RoleUsuario.ADMIN) {
        return NextResponse.json({ message: "Acceso denegado." }, { status: 403 });
    }

    let records: CsvRow[];
    try {
        records = await request.json();
    } catch {
        return NextResponse.json({ message: "Error al parsear JSON." }, { status: 400 });
    }

    if (!Array.isArray(records) || records.length === 0) {
        return NextResponse.json({ message: "No se proporcionaron registros." }, { status: 400 });
    }
    
    const groupedData = new Map<string, { ticket: CsvRow | null, actions: CsvRow[] }>();
    let originalRowIndex = 2;
    for (const record of records) {
        (record as any).originalRowIndex = originalRowIndex++;
        if (!record.numero_ticket_asociado) continue;
        const key = record.numero_ticket_asociado;
        if (!groupedData.has(key)) {
            groupedData.set(key, { ticket: null, actions: [] });
        }
        if (record.tipo_registro === 'TICKET') {
            groupedData.get(key)!.ticket = record;
        } else if (record.tipo_registro === 'ACCION') {
            groupedData.get(key)!.actions.push(record);
        }
    }

    const processingErrors: ProcessingError[] = [];
    let successfulCount = 0;
    
    try {
        await prisma.$transaction(async (tx) => {
            const empresas = await tx.empresa.findMany({ select: { id: true, nombre: true }});
            const usuarios = await tx.user.findMany({ select: { id: true, email: true }});
            const sucursales = await tx.sucursal.findMany({ select: { id: true, nombre: true } });

            const empresaMap = new Map(empresas.map(e => [e.nombre.toLowerCase(), e.id]));
            const usuarioMap = new Map(usuarios.map(u => [u.email?.toLowerCase(), u.id]));
            const sucursalMap = new Map(sucursales.map(s => [s.nombre.toLowerCase(), s.id]));
            
            let lastTicket = await tx.ticket.findFirst({ orderBy: { numeroCaso: 'desc' }, select: { numeroCaso: true } });
            let currentNumeroCaso = lastTicket?.numeroCaso || 0;

            for (const { ticket, actions } of groupedData.values()) {
                const currentRowIndex = (ticket as any)?.originalRowIndex || 0;
                if (!ticket) continue;

                const empresaId = empresaMap.get(ticket.empresaClienteNombre?.toLowerCase() || '');
                if (!empresaId) {
                    processingErrors.push({ row: currentRowIndex, data: ticket, error: `Empresa no encontrada: "${ticket.empresaClienteNombre}"` });
                    continue;
                }
                
                const sucursalId = sucursalMap.get(ticket.ubicacionNombre?.toLowerCase() || '');
                if (!sucursalId) {
                    processingErrors.push({ row: currentRowIndex, data: ticket, error: `Sucursal no encontrada: "${ticket.ubicacionNombre}"` });
                    continue;
                }
                
                const tecnicoId = usuarioMap.get(ticket.tecnicoAsignadoEmail?.toLowerCase() || '');
                if (!tecnicoId) {
                    processingErrors.push({ row: currentRowIndex, data: ticket, error: `Técnico no encontrado: "${ticket.tecnicoAsignadoEmail}"`});
                    continue;
                }
                
                currentNumeroCaso++;
                const newTicket = await tx.ticket.create({
                    data: {
                        numeroCaso: currentNumeroCaso,
                        titulo: ticket.titulo!,
                        descripcionDetallada: ticket.descripcionDetallada,
                        tipoIncidente: ticket.tipoIncidente!,
                        prioridad: ticket.prioridad! as PrioridadTicket,
                        estado: ticket.estado! as EstadoTicket,
                        solicitanteNombre: ticket.solicitanteNombre!,
                        solicitanteTelefono: ticket.solicitanteTelefono,
                        solicitanteCorreo: ticket.solicitanteCorreo,
                        equipoAfectado: ticket.equipo_afectado,
                        fechaCreacion: new Date(ticket.fechaCreacion!),
                        fechaSolucionReal: ticket.fechaSolucionReal ? new Date(ticket.fechaSolucionReal) : null,
                        empresaId: empresaId,
                        sucursalId: sucursalId, // <-- USANDO LA RELACIÓN DIRECTA Y CORRECTA
                        tecnicoAsignadoId: tecnicoId,
                    }
                });
                successfulCount++;

                for (const action of actions) {
                    const actionRowIndex = (action as any).originalRowIndex;
                    const accionUsuarioId = usuarioMap.get(action.accion_usuario_email?.toLowerCase() || '');
                    if (!accionUsuarioId) {
                        processingErrors.push({ row: actionRowIndex, data: action, error: `Usuario para acción no encontrado: "${action.accion_usuario_email}"` });
                        continue; 
                    }
                    await tx.accionTicket.create({
                        data: {
                            ticketId: newTicket.id,
                            descripcion: action.accion_descripcion!,
                            fechaAccion: new Date(action.accion_fecha!),
                            usuarioId: accionUsuarioId,
                            categoria: action.accion_categoria,
                        }
                    });
                    successfulCount++;
                }
            }
            
            if (processingErrors.length > 0) {
                throw new Error("Errores de validación durante el procesamiento.");
            }
        });

        revalidatePath('/tickets/dashboard');
        return NextResponse.json({
            message: "Importación completada con éxito.",
            successfulCount,
            failedCount: 0,
            errors: [],
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error en la transacción de importación:", error);
        return NextResponse.json({
            message: error.message === "Errores de validación durante el procesamiento." ? "La importación fue cancelada debido a errores en los datos." : "Error interno del servidor.",
            successfulCount: 0,
            failedCount: records.length,
            errors: processingErrors,
        }, { status: 400 });
    }
}

