// src/app/actions/ticketActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from "next/cache";
import { ActionEntry } from '@/types/ticket';

// Interfaz para los datos que vienen del FormData del formulario.
// Los nombres aquí coinciden con los atributos 'name' de tus inputs.
interface TicketFormInputFields {
  nroCaso: number;
  empresa: string;
  tipo: string; // Este es 'tipoIncidente' en el modelo Prisma
  ubicacion: string;
  tecnico: string; // Este es 'tecnicoAsignado' en el modelo Prisma
  contacto: string; // Este es 'solicitante' en el modelo Prisma
  tituloDelTicket: string; // Este es 'titulo' en el modelo Prisma
  detalleAdicional?: string; // Este es 'descripcionDetallada' en el modelo Prisma
  prioridad: string;
  // estado se define internamente, no usualmente desde el form de creación inicial
  accionInicial?: string; // Esto se usa para crear la primera acción en la bitácora
  createdAt: string; // Esta es 'fechaCreacion' en el modelo Prisma (fecha de reporte del formulario)
  fechaSolucion?: string | null;
}

// Tipo para el estado que la acción maneja y devuelve.
interface ActionState {
  error?: string;
  success?: boolean;
  message?: string;
  ticketId?: string;
}

export async function loadLastTicketNro(): Promise<number> {
  try {
    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { numeroCaso: "desc" }, // ACTUALIZADO al nuevo nombre del modelo
      select: { numeroCaso: true },    // ACTUALIZADO al nuevo nombre del modelo
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
  // Recolectar datos del FormData usando los nombres de los inputs del formulario
  const formInput: TicketFormInputFields = {
    nroCaso: parseInt(formdata.get("nroCaso")?.toString() || "0"),
    empresa: formdata.get("empresa")?.toString() || "",
    tipo: formdata.get("tipo")?.toString() || "",
    ubicacion: formdata.get("ubicacion")?.toString() || "",
    tecnico: formdata.get("tecnico")?.toString() || "",
    contacto: formdata.get("contacto")?.toString() || "",
    tituloDelTicket: formdata.get("tituloDelTicket")?.toString() || "",
    detalleAdicional: formdata.get("detalleAdicional")?.toString() || "",
    prioridad: formdata.get("prioridad")?.toString() || "",
    accionInicial: formdata.get("accionInicial")?.toString() || "",
    createdAt: formdata.get("createdAt")?.toString() || new Date().toISOString().split('T')[0],
    fechaSolucion: formdata.get("fechaSolucion")?.toString() || null,
  };

  // Validación de campos obligatorios (usando los nombres de formInput)
  if (
    !formInput.nroCaso || !formInput.empresa || !formInput.prioridad || !formInput.tecnico || !formInput.tipo ||
    !formInput.tituloDelTicket || !formInput.ubicacion || !formInput.contacto || !formInput.createdAt
  ) {
    return { error: "Faltan campos obligatorios para el ticket.", success: false };
  }

  // Preparar la primera acción para la bitácora
  const accionesArray: ActionEntry[] = [];
  let primeraAccionDesc = "";

  // Usar detalleAdicional para la descripción de la primera acción si existe
  if (formInput.detalleAdicional?.trim()) {
    primeraAccionDesc += `Detalle del problema: ${formInput.detalleAdicional.trim()}`;
  }
  if (formInput.accionInicial?.trim()) {
    if (primeraAccionDesc) primeraAccionDesc += "\n"; // Añadir nueva línea si ya hay descripción
    primeraAccionDesc += `Acción inicial realizada: ${formInput.accionInicial.trim()}`;
  }
  
  if (primeraAccionDesc.trim()) {
    accionesArray.push({
      id: uuidv4(),
      fecha: new Date().toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }),
      descripcion: primeraAccionDesc.trim(),
    });
  }
  const accionesParaGuardar = JSON.stringify(accionesArray);

  // Conversión de fechas
  const fechaCreacionDate = new Date(formInput.createdAt + "T00:00:00Z"); // Asumir que la fecha del input es local y convertir a UTC para guardar
  const fechaSolucionDate = formInput.fechaSolucion ? new Date(formInput.fechaSolucion + "T00:00:00Z") : null;

  // Mapeo de los nombres de formInput a los nombres del modelo Prisma para guardar
  const ticketDataToSave = {
    numeroCaso: formInput.nroCaso,                     // Mapeado
    empresa: formInput.empresa,
    tipoIncidente: formInput.tipo,                    // Mapeado
    ubicacion: formInput.ubicacion,
    tecnicoAsignado: formInput.tecnico,               // Mapeado
    solicitante: formInput.contacto,                  // Mapeado
    titulo: formInput.tituloDelTicket,                // Mapeado
    descripcionDetallada: formInput.detalleAdicional?.trim() || null, // Mapeado y puede ser null si no se provee
    prioridad: formInput.prioridad,
    estado: "Abierto",                                // Estado inicial por defecto
    acciones: accionesParaGuardar,
    fechaCreacion: fechaCreacionDate,                 // Mapeado
    fechaSolucion: fechaSolucionDate,
    // fechaActualizacion se maneja automáticamente por @updatedAt en el schema.prisma
  };

  try {
    const newTicket = await prisma.ticket.create({ data: ticketDataToSave });
    revalidatePath("/tickets/dashboard"); // Revalida la ruta para mostrar el nuevo ticket
    return { 
      success: true, 
      message: `Ticket #${newTicket.numeroCaso} creado exitosamente.`, 
      ticketId: newTicket.id 
    };
  } catch (error: any) {
    console.error("Error al crear ticket en Prisma:", error.message);
    // Devolver el mensaje de error específico de Prisma puede ser útil para depurar
    return { error: `Error al crear el ticket: ${error.message}`, success: false };
  }
}
