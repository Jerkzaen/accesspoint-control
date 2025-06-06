// src/app/actions/ticketActions.ts
'use server'; // <--- ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ AL PRINCIPIO DEL ARCHIVO

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
// Actualizada para coincidir con los 'name' attributes del TicketFormInModal.tsx
interface TicketFormInputFields {
  nroCaso: number;
  fechaCreacion: string; // Ahora puede incluir la hora:YYYY-MM-DDTHH:MM
  empresaClienteId?: string; // Ahora es el ID de EmpresaCliente, puede ser opcional
  tipoIncidente: string;    
  prioridad: string;        // El valor será una de las claves del Enum PrioridadTicket
  ubicacionId?: string;      // Ahora esperamos el ID de la Ubicacion, puede ser opcional
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
  ticket?: Ticket; // Añadir el objeto Ticket completo aquí
}

const initialState: ActionState = {
  error: undefined,
  success: undefined,
  message: undefined,
  ticketId: undefined,
  ticket: undefined,
};

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

  const formInput: TicketFormInputFields = {
    nroCaso: parseInt(formdata.get("nroCaso")?.toString() || "0"),
    fechaCreacion: formdata.get("fechaCreacion")?.toString() || new Date().toISOString().substring(0, 16), 
    empresaClienteId: formdata.get("empresaClienteId")?.toString() || undefined,
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

  // Validación de campos obligatorios
  let missingFields = [];
  if (!formInput.nroCaso) missingFields.push("N° de Caso");
  if (!formInput.tipoIncidente) missingFields.push("Tipo de Incidente");
  if (!formInput.titulo) missingFields.push("Título");
  if (!formInput.solicitanteNombre) missingFields.push("Nombre Solicitante");
  if (!formInput.fechaCreacion) missingFields.push("Fecha Reporte");
  
  if (missingFields.length > 0) {
      return { error: `Faltan campos obligatorios: ${missingFields.join(', ')}.`, success: false };
  }
  
  if (!Object.values(PrioridadTicket).includes(formInput.prioridad as PrioridadTicket)) {
    return { error: `Prioridad inválida: ${formInput.prioridad}. Valores permitidos: BAJA, MEDIA, ALTA, URGENTE.`, success: false };
  }

  const fechaCreacionDate = new Date(formInput.fechaCreacion); 
  const fechaSolucionEstimadaDate = formInput.fechaSolucionEstimada ? new Date(formInput.fechaSolucionEstimada) : null;

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
    empresaClienteId: formInput.empresaClienteId || null, 
    ubicacionId: formInput.ubicacionId || null,         
    tecnicoAsignadoId: tecnicoLogueadoId, 
    fechaCreacion: fechaCreacionDate,
    fechaSolucionEstimada: fechaSolucionEstimadaDate,
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
          include: {
            realizadaPor: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        empresaCliente: { select: { id: true, nombre: true } },
        ubicacion: { select: { id: true, nombreReferencial: true, direccionCompleta: true } },
        tecnicoAsignado: { select: { id: true, name: true, email: true } },
      },
    });

    if (!fullCreatedTicket) {
      console.warn(`Ticket ${newTicket.id} no encontrado después de la creación/transacción. Revalidación podría no ser perfecta.`);
      revalidatePath("/tickets/dashboard");
      return { 
        success: true, 
        message: `Ticket #${newTicket.numeroCaso} creado exitosamente, pero con datos incompletos.`, 
        ticketId: newTicket.id 
      };
    }

    revalidatePath("/tickets/dashboard"); 
    return { 
      success: true, 
      message: `Ticket #${newTicket.numeroCaso} creado exitosamente. Técnico asignado: ${currentUser.name || currentUser.email}.`, 
      ticketId: newTicket.id,
      ticket: fullCreatedTicket 
    };
  } catch (error: any) {
    console.error("Error al crear ticket en Prisma:", error);
    let errorMessage = "Error al crear el ticket.";
    if (error.code === 'P2002' && error.meta?.target?.includes('numeroCaso')) {
        errorMessage = "El número de caso ya existe.";
    } else if (error.code === 'P2003') { 
        if (error.meta?.field_name?.includes('empresaClienteId')) {
            errorMessage = "La empresa cliente seleccionada no es válida.";
        } else if (error.meta?.field_name?.includes('ubicacionId')) {
            errorMessage = "La ubicación seleccionada no es válida.";
        }
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { error: errorMessage, success: false };
  }
}
