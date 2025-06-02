// Asume que este archivo está en: src/app/actions/ticketActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from 'uuid';
// import { redirect } from "next/navigation"; // Descomenta si la vas a usar
import { revalidatePath } from "next/cache";
import { ActionEntry } from '@/types/ticket';

// Interfaz para los datos del formulario (puede vivir aquí o ser importada)
interface TicketFormFields {
  nroCaso: number;
  empresa: string;
  ubicacion: string;
  contacto: string;
  prioridad: string;
  tecnico: string;
  tipo: string;
  tituloDelTicket: string;
  detalleAdicional?: string;
  accionInicial?: string;
  fechaSolucion?: string | null;
  createdAt: string;
}

// Tipo para el estado que la acción maneja y devuelve.
// Debe ser consistente con `initialState` en `ticket-form.tsx`.
interface ActionState {
  error?: string;
  success?: boolean;
  message?: string;
  ticketId?: string;
}

export async function loadLastTicketNro(): Promise<number> {
  try {
    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { nroCaso: "desc" },
      select: { nroCaso: true },
    });
    return lastTicket?.nroCaso || 0;
  } catch (error) {
    console.error("Error al cargar nroCaso del último ticket:", error);
    return 0; 
  }
}

export async function createNewTicketAction(
  previousState: ActionState, // <--- AÑADIDO: Primer parámetro es el estado previo
  formdata: FormData          // <--- SEGUNDO parámetro es FormData
): Promise<ActionState> {     // <--- TIPO DE RETORNO consistente con ActionState
  const data: TicketFormFields = {
    nroCaso: parseInt(formdata.get("nroCaso")?.toString() || "0"),
    empresa: formdata.get("empresa")?.toString() || "",
    prioridad: formdata.get("prioridad")?.toString() || "",
    tecnico: formdata.get("tecnico")?.toString() || "",
    tipo: formdata.get("tipo")?.toString() || "",
    tituloDelTicket: formdata.get("tituloDelTicket")?.toString() || "",
    detalleAdicional: formdata.get("detalleAdicional")?.toString() || "",
    ubicacion: formdata.get("ubicacion")?.toString() || "",
    contacto: formdata.get("contacto")?.toString() || "",
    createdAt: formdata.get("createdAt")?.toString() || new Date().toISOString().split('T')[0],
    accionInicial: formdata.get("accionInicial")?.toString() || "",
    fechaSolucion: formdata.get("fechaSolucion")?.toString() || null,
  };

  if (
    !data.nroCaso || !data.empresa || !data.prioridad || !data.tecnico || !data.tipo ||
    !data.tituloDelTicket || !data.ubicacion || !data.contacto || !data.createdAt
  ) {
    console.error("Faltan campos obligatorios para el ticket.");
    // Devuelve el estado de error
    return { error: "Faltan campos obligatorios para el ticket.", success: false };
  }

  const accionesArray: ActionEntry[] = [];
  let descripcionPrincipalTicket = data.tituloDelTicket;
  let primeraAccionDesc = "";

  if (data.detalleAdicional?.trim()) {
    primeraAccionDesc += `Detalle del problema: ${data.detalleAdicional.trim()}`;
  }
  if (data.accionInicial?.trim()) {
    if (primeraAccionDesc) primeraAccionDesc += "\n";
    primeraAccionDesc += `Acción inicial realizada: ${data.accionInicial.trim()}`;
  }
  
  if (primeraAccionDesc.trim()) {
    accionesArray.push({
      id: uuidv4(),
      fecha: new Date().toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }),
      descripcion: primeraAccionDesc.trim(),
    });
  }

  const accionesParaGuardar = JSON.stringify(accionesArray);
  const createdAtDate = new Date(data.createdAt + "T00:00:00Z"); 
  const fechaSolucionDate = data.fechaSolucion ? new Date(data.fechaSolucion + "T00:00:00Z") : null;

  const ticketDataToSave = {
    nroCaso: data.nroCaso,
    empresa: data.empresa,
    prioridad: data.prioridad,
    tecnico: data.tecnico,
    tipo: data.tipo,
    descripcion: descripcionPrincipalTicket,
    ubicacion: data.ubicacion,
    contacto: data.contacto,
    acciones: accionesParaGuardar,
    createdAt: createdAtDate,
    fechaSolucion: fechaSolucionDate,
    estado: "Abierto",
  };

  try {
    const newTicket = await prisma.ticket.create({ data: ticketDataToSave });
    console.log("Ticket creado con datos:", newTicket);
    revalidatePath("/tickets/dashboard"); 
    return { 
      success: true, 
      message: `Ticket #${newTicket.nroCaso} creado exitosamente.`, 
      ticketId: newTicket.id 
    };
  } catch (error: any) {
    console.error("Error al crear ticket en Prisma:", error.message); 
    return { error: `Error al crear el ticket: ${error.message}`, success: false };
  }
}
