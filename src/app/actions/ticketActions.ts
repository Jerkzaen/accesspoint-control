// src/app/actions/ticketActions.ts
'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrioridadTicket, EstadoTicket, RoleUsuario } from "@prisma/client";
import { Ticket } from '@/types/ticket';

// Interfaz para el tipo de usuario esperado en la sesión (con id y rol)
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  rol?: RoleUsuario;
}

// Interfaz para los datos que vienen del FormData del formulario.
interface TicketFormInputFields {
  nroCaso: number;
  fechaCreacion: string;
  empresaId?: string; // <-- CAMBIO CLAVE: Renombrado de empresaClienteId a empresaId
  tipoIncidente: string;
  prioridad: string;
  ubicacionId?: string; // Este campo ya era correcto según el schema.
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

// No hay cambios en esta función
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
  const tecnicoLogueadoRol = currentUser.rol;

  if (tecnicoLogueadoRol !== "TECNICO" && tecnicoLogueadoRol !== "ADMIN") {
      return { error: "Usuario no autorizado para crear tickets.", success: false };
  }

  // Mapeo de FormData a un objeto
  const formInput: TicketFormInputFields = {
    nroCaso: parseInt(formdata.get("nroCaso")?.toString() || "0"),
    fechaCreacion: formdata.get("fechaCreacion")?.toString() || new Date().toISOString().substring(0, 16),
    empresaId: formdata.get("empresaId")?.toString() || undefined, // <-- CAMBIO CLAVE: Se lee 'empresaId' desde el form
    tipoIncidente: formdata.get("tipoIncidente")?.toString() || "",
    prioridad: formdata.get("prioridad")?.toString() || "MEDIA",
    ubicacionId: formdata.get("ubicacionId")?.toString() || undefined,
    solicitanteNombre: formdata.get("solicitanteNombre")?.toString() || "",
    solicitanteTelefono: formdata.get("solicitanteTelefono")?.toString() || undefined,
    solicitanteCorreo: formdata.get("solicitanteCorreo")?.toString() || undefined,
    titulo: formdata.get("titulo")?.toString() || "",
    descripcionDetallada: formdata.get("descripcionDetallada")?.toString() || undefined,
    accionInicial: formdata.get("accionInicial")?.toString() || undefined,
    fechaSolucionEstimada: formdata.get("fechaSolucionEstimada")?.toString() || null,
  };

  const fechaCreacionDate = new Date(formInput.fechaCreacion);
  const fechaSolucionEstimadaDate = formInput.fechaSolucionEstimada ? new Date(formInput.fechaSolucionEstimada) : null;

  if (!formInput.nroCaso || !formInput.tipoIncidente || !formInput.titulo || !formInput.solicitanteNombre || !formInput.fechaCreacion) {
    return { error: "Faltan campos obligatorios. Por favor, complete todos los campos requeridos.", success: false };
  }

  if (!Object.values(PrioridadTicket).includes(formInput.prioridad as PrioridadTicket)) {
    return { error: `Prioridad inválida: ${formInput.prioridad}. Valores permitidos: BAJA, MEDIA, ALTA, URGENTE.`, success: false };
  }

  // Datos del ticket a guardar en la base de datos
  const ticketDataToSave = {
    numeroCaso: formInput.nroCaso,
    titulo: formInput.titulo,
    descripcionDetallada: formInput.descripcionDetallada?.trim() || null,
    tipoIncidente: formInput.tipoIncidente,
    prioridad: formInput.prioridad as PrioridadTicket,
    estado: EstadoTicket.ABIERTO,
    solicitanteNombre: formInput.solicitanteNombre,
    solicitanteTelefono: formInput.solicitanteTelefono || null,
    solicitanteCorreo: formInput.solicitanteCorreo || null,
    empresaId: formInput.empresaId || null, // <-- CAMBIO CLAVE: Renombrado
    ubicacionId: formInput.ubicacionId || null,
    tecnicoAsignadoId: tecnicoLogueadoId,
    fechaCreacion: fechaCreacionDate,
    fechaSolucionEstimada: fechaSolucionEstimadaDate,
    // El campo contactoId es opcional y se manejará por separado si se implementa la creación "al vuelo"
  };

  try {
    const newTicket = await prisma.$transaction(async (tx) => {
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

    const fullCreatedTicket = await prisma.ticket.findUnique({
      where: { id: newTicket.id },
      include: {
        acciones: {
          orderBy: { fechaAccion: 'asc' },
          include: { realizadaPor: { select: { id: true, name: true, email: true } } }
        },
        empresa: { select: { id: true, nombre: true } },
        ubicacionReporte: { include: { sucursal: { include: { direccion: true } } } },
        tecnicoAsignado: { select: { id: true, name: true, email: true } },
        contacto: { select: { id: true, nombreCompleto: true } }, // <-- CAMBIO CLAVE: incluir 'contacto'
      },
    });

    if (!fullCreatedTicket) {
      revalidatePath("/tickets/dashboard");
      return {
        success: true,
        message: `Ticket #${newTicket.numeroCaso} creado, pero con datos incompletos.`,
        ticketId: newTicket.id
      };
    }

    revalidatePath("/tickets/dashboard");
    return {
      success: true,
      message: `Ticket #${newTicket.numeroCaso} creado exitosamente.`,
      ticketId: newTicket.id,
      ticket: fullCreatedTicket
    };
  } catch (error: any) {
    console.error("Error al crear ticket en Prisma:", error);
    let errorMessage = "Error al crear el ticket.";
    
    if (error.code === 'P2002' && error.meta?.target?.includes('numeroCaso')) {
        errorMessage = "El número de caso ya existe. Por favor, intente con otro.";
    } else if (error.code === 'P2003') {
        // <-- CAMBIO CLAVE: Actualizar mensajes de error
        if (error.meta?.field_name?.includes('empresaId')) {
            errorMessage = "La empresa cliente seleccionada no es válida.";
        } else if (error.meta?.field_name?.includes('ubicacionId')) {
            errorMessage = "La ubicación seleccionada no es válida.";
        } else if (error.meta?.field_name?.includes('tecnicoAsignadoId')) {
          errorMessage = "El técnico asignado no es válido.";
        }
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { error: errorMessage, success: false };
  }
}
