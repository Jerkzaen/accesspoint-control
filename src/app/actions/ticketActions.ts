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
// Esta interfaz se mantiene para asegurar la correcta lectura del FormData.
interface TicketFormInputFields {
  nroCaso: number;
  fechaCreacion: string; 
  empresaClienteId?: string; 
  tipoIncidente: string;    
  prioridad: string;        
  ubicacionId?: string;      
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
    // En un entorno real, podrías querer manejar este error de forma más robusta,
    // por ejemplo, lanzando una excepción o devolviendo un estado de error específico.
    return 0; 
  }
}

export async function createNewTicketAction(
  previousState: ActionState, // El estado anterior del Server Action (no se usa directamente en este flujo)
  formdata: FormData
): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as SessionUser | undefined;

  // Validación de autenticación del usuario
  if (!currentUser?.id) {
    return { error: "Usuario no autenticado. No se puede crear el ticket.", success: false };
  }
  
  const tecnicoLogueadoId = currentUser.id;
  const tecnicoLogueadoRol = currentUser.rol;

  // Validación de rol del usuario
  if (tecnicoLogueadoRol !== "TECNICO" && tecnicoLogueadoRol !== "ADMIN") {
      return { error: "Usuario no autorizado para crear tickets.", success: false };
  }

  // Mapeo de FormData a un objeto para fácil acceso y validación (aunque Zod ya lo hizo)
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

  // Conversión de fechas a objetos Date. La validación de formato ya fue hecha por Zod.
  const fechaCreacionDate = new Date(formInput.fechaCreacion); 
  const fechaSolucionEstimadaDate = formInput.fechaSolucionEstimada ? new Date(formInput.fechaSolucionEstimada) : null;

  // Verificación de existencia de valores esenciales (aunque Zod ya ayuda, es una última capa)
  if (!formInput.nroCaso || !formInput.tipoIncidente || !formInput.titulo || !formInput.solicitanteNombre || !formInput.fechaCreacion) {
    return { error: "Faltan campos obligatorios. Por favor, complete todos los campos requeridos.", success: false };
  }

  // Asegurar que la prioridad es un valor válido del enum de Prisma
  // Esto es una capa de seguridad en el backend, en caso de que la validación del frontend falle o se omita.
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
    estado: EstadoTicket.ABIERTO, // El estado inicial de un ticket nuevo es 'ABIERTO'
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
    // Usamos una transacción para asegurar que tanto el ticket como la acción inicial
    // se creen o fallen juntos.
    const newTicket = await prisma.$transaction(async (tx) => {
      const createdTicket = await tx.ticket.create({
        data: ticketDataToSave,
      });

      // Si hay una acción inicial proporcionada, la creamos
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

    // Recuperamos el ticket completo con todas sus relaciones para devolverlo
    const fullCreatedTicket = await prisma.ticket.findUnique({
      where: { id: newTicket.id },
      include: {
        acciones: { 
          orderBy: { fechaAccion: 'asc' }, // Ordenar acciones por fecha de creación
          include: {
            realizadaPor: { // Incluir la información del usuario que realizó la acción
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

    // Si por alguna razón el ticket completo no se encuentra (caso raro post-creación)
    if (!fullCreatedTicket) {
      console.warn(`Ticket ${newTicket.id} no encontrado después de la creación/transacción. Revalidación podría no ser perfecta.`);
      revalidatePath("/tickets/dashboard"); // Revalidar la caché para asegurar que la lista se actualice
      return { 
        success: true, 
        message: `Ticket #${newTicket.numeroCaso} creado exitosamente, pero con datos incompletos.`, 
        ticketId: newTicket.id 
      };
    }

    revalidatePath("/tickets/dashboard"); // Revalidar la caché de la ruta del dashboard
    return { 
      success: true, 
      message: `Ticket #${newTicket.numeroCaso} creado exitosamente. Técnico asignado: ${currentUser.name || currentUser.email}.`, 
      ticketId: newTicket.id,
      ticket: fullCreatedTicket // Devolvemos el objeto Ticket completo
    };
  } catch (error: any) {
    console.error("Error al crear ticket en Prisma:", error);
    let errorMessage = "Error al crear el ticket.";
    // Manejo específico de errores de Prisma
    if (error.code === 'P2002' && error.meta?.target?.includes('numeroCaso')) {
        errorMessage = "El número de caso ya existe. Por favor, intente con otro.";
    } else if (error.code === 'P2003') { 
        if (error.meta?.field_name?.includes('empresaClienteId')) {
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