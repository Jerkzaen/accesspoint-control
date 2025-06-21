// RUTA: src/app/actions/ticketActions.ts
'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// --- CAMBIO CLAVE: Importación de tipos y Prisma ---
// Se importa 'Prisma' para tipar la transacción y los enums como tipos.
import { Prisma, type PrioridadTicket, type EstadoTicket, type RoleUsuario } from "@prisma/client";
import type { Ticket } from '@/types/ticket';

interface SessionUser {
  id: string;
  rol?: RoleUsuario;
}

// Interfaz que representa los datos que ahora vienen del formulario
interface TicketFormInputFields {
  nroCaso: number;
  fechaCreacion: string;
  empresaId: string;
  sucursalId: string;
  tipoIncidente: string;
  prioridad: string;
  solicitanteNombre: string;
  solicitanteTelefono?: string;
  solicitanteCorreo?: string;
  titulo: string;
  descripcionDetallada?: string;
  accionInicial?: string;
  fechaSolucionEstimada?: string | null;
}

interface ActionState {
  error?: string;
  success?: boolean;
  message?: string;
  ticketId?: string;
  ticket?: Ticket;
}

export async function loadLastTicketNro(): Promise<number> {
  try {
    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { numeroCaso: "desc" },
      select: { numeroCaso: true },
    });
    return lastTicket?.numeroCaso || 0;
  } catch (error) {
    console.error("Error al cargar numeroCaso del último ticket:", error);
    return 0;
  }
}

export async function createNewTicketAction(
  previousState: ActionState,
  formdata: FormData
): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as SessionUser | undefined;

  if (!currentUser?.id) {
    return { error: "Usuario no autenticado. No se puede crear el ticket.", success: false };
  }
  
  const tecnicoLogueadoId = currentUser.id;
  
  const formInput: TicketFormInputFields = {
    nroCaso: parseInt(formdata.get("nroCaso")?.toString() || "0"),
    fechaCreacion: formdata.get("fechaCreacion")?.toString() || '',
    empresaId: formdata.get("empresaId")?.toString() || '',
    sucursalId: formdata.get("sucursalId")?.toString() || '',
    tipoIncidente: formdata.get("tipoIncidente")?.toString() || '',
    prioridad: formdata.get("prioridad")?.toString() || "MEDIA",
    solicitanteNombre: formdata.get("solicitanteNombre")?.toString() || '',
    solicitanteTelefono: formdata.get("solicitanteTelefono")?.toString(),
    solicitanteCorreo: formdata.get("solicitanteCorreo")?.toString(),
    titulo: formdata.get("titulo")?.toString() || '',
    descripcionDetallada: formdata.get("descripcionDetallada")?.toString(),
    accionInicial: formdata.get("accionInicial")?.toString(),
    fechaSolucionEstimada: formdata.get("fechaSolucionEstimada")?.toString() || null,
  };

  if (!formInput.empresaId || !formInput.sucursalId || !formInput.titulo) {
      return { error: "Faltan campos obligatorios: Empresa, Sucursal y Título son requeridos.", success: false };
  }

  const fechaCreacionDate = new Date(formInput.fechaCreacion);
  const fechaSolucionEstimadaDate = formInput.fechaSolucionEstimada ? new Date(formInput.fechaSolucionEstimada) : null;

  const ticketDataToSave = {
    numeroCaso: formInput.nroCaso,
    titulo: formInput.titulo,
    descripcionDetallada: formInput.descripcionDetallada?.trim(),
    tipoIncidente: formInput.tipoIncidente,
    prioridad: formInput.prioridad as PrioridadTicket,
    estado: 'ABIERTO' as EstadoTicket,
    solicitanteNombre: formInput.solicitanteNombre,
    solicitanteTelefono: formInput.solicitanteTelefono,
    solicitanteCorreo: formInput.solicitanteCorreo,
    empresaId: formInput.empresaId, 
    sucursalId: formInput.sucursalId,
    tecnicoAsignadoId: tecnicoLogueadoId,
    fechaCreacion: fechaCreacionDate,
    fechaSolucionEstimada: fechaSolucionEstimadaDate,
  };

  try {
    // --- CAMBIO CLAVE: Se añade el tipo explícito a 'tx' ---
    const newTicket = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createdTicket = await tx.ticket.create({
        data: ticketDataToSave,
      });

      if (formInput.accionInicial?.trim()) {
        await tx.accionTicket.create({
          data: {
            ticketId: createdTicket.id,
            descripcion: formInput.accionInicial.trim(),
            usuarioId: tecnicoLogueadoId,
          },
        });
      }
      return createdTicket;
    });

    revalidatePath("/tickets/dashboard"); 
    
    return { 
      success: true, 
      message: `Ticket #${newTicket.numeroCaso} creado exitosamente.`,
      ticketId: newTicket.id,
      ticket: newTicket as unknown as Ticket
    };
  } catch (error: any) {
    console.error("Error al crear ticket en Prisma:", error);
    let errorMessage = "Error al crear el ticket.";
    if (error.code === 'P2002' && error.meta?.target?.includes('numeroCaso')) {
        errorMessage = "El número de caso ya existe. Por favor, intente con otro.";
    } else {
        errorMessage = "No se pudo crear el ticket. Revise los datos e intente de nuevo.";
    }
    return { error: errorMessage, success: false };
  }
}