import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from 'uuid'; // Para generar IDs únicos
import { Ticket as GlobalTicket, ActionEntry } from '@/types/ticket'; // Importar tipos globales

// Interfaz para los datos del formulario, puede ser un subconjunto o adaptación de GlobalTicket
interface TicketFormFields {
  nroCaso: number;
  empresa: string;
  ubicacion: string;
  contacto: string;
  prioridad: string;
  tecnico: string;
  tipo: string;
  tituloDelTicket: string; // Campo para el título/descripción principal
  detalleAdicional?: string; // Campo para la descripción más larga
  accionInicial?: string; // Campo para la primera acción de la bitácora
  fechaSolucion?: string | null;
  createdAt: string; 
}


async function loadLastTicketNro(): Promise<number> {
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

export async function TicketForm() {
  const lastNroCaso = await loadLastTicketNro();
  const nextNroCaso = lastNroCaso + 1;

  async function createNewTicketAction(formdata: FormData) {
    "use server";

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
      // Aquí podrías retornar un mensaje de error para mostrar en la UI si usaras useFormState
      return; 
    }

    const accionesArray: ActionEntry[] = [];
    let descripcionPrincipalTicket = data.tituloDelTicket;

    // Combinar detalle adicional con la acción inicial si ambos existen, o usar el que exista.
    let primeraAccionDesc = "";
    if (data.detalleAdicional?.trim()) {
        primeraAccionDesc += `Detalle del problema: ${data.detalleAdicional.trim()}`;
    }
    if (data.accionInicial?.trim()) {
        if (primeraAccionDesc) primeraAccionDesc += "\n"; // Nueva línea si ya hay detalle
        primeraAccionDesc += `Acción inicial realizada: ${data.accionInicial.trim()}`;
    }
    
    if (primeraAccionDesc.trim()) {
      accionesArray.push({
        id: uuidv4(), // Generar ID único para la acción
        fecha: new Date().toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }),
        descripcion: primeraAccionDesc.trim(),
      });
    }

    const accionesParaGuardar = JSON.stringify(accionesArray);
    // Asegurar que la fecha se interprete como inicio del día en la zona horaria local del servidor
    const createdAtDate = new Date(data.createdAt + "T00:00:00"); 
    const fechaSolucionDate = data.fechaSolucion ? new Date(data.fechaSolucion + "T00:00:00") : null;

    // Datos para Prisma, asegurando que coincidan con el schema
    const ticketDataToSave = {
      nroCaso: data.nroCaso,
      empresa: data.empresa,
      prioridad: data.prioridad,
      tecnico: data.tecnico,
      tipo: data.tipo,
      descripcion: descripcionPrincipalTicket, // El título va al campo 'descripcion' de la BD
      ubicacion: data.ubicacion,
      contacto: data.contacto,
      acciones: accionesParaGuardar, 
      createdAt: createdAtDate, // Prisma espera Date
      fechaSolucion: fechaSolucionDate, // Prisma espera Date o null
      estado: "Abierto", // Estado por defecto
      // Si tienes un campo para 'detalleAdicional' en tu BD, añádelo aquí.
      // Por ejemplo: detalleAdicional: data.detalleAdicional || null,
    };

    try {
      await prisma.ticket.create({ data: ticketDataToSave });
      console.log("Ticket creado con datos:", ticketDataToSave);
    } catch (error: any) {
      console.error("Error al crear ticket en Prisma:", error.message);
      // Podrías querer manejar este error de forma diferente, quizás retornando un mensaje.
      // Por ahora, la redirección no ocurrirá si hay un error aquí.
      return; // Evita la redirección si hay error
    }
    
    // La redirección debe ocurrir fuera del try/catch si el error en Prisma no la previene.
    // O, si quieres que siempre redirija, incluso con error (no recomendado), muévela fuera.
    // Para Server Actions, redirect() lanza una excepción especial.
    redirect("/tickets/dashboard");
  }

  return (
    <Card className="w-full max-w-2xl mx-auto"> 
      <CardHeader>
        <CardTitle>Crear Nuevo Ticket</CardTitle>
        <CardDescription>Ingresa la información detallada del problema.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* El form ahora llama a createNewTicketAction */}
        <form action={createNewTicketAction} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nroCaso">N° de Caso</Label>
              <Input name="nroCaso" id="nroCaso" defaultValue={nextNroCaso} readOnly className="bg-muted"/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="createdAt">Fecha Reporte</Label>
              <Input type="date" name="createdAt" id="createdAt" defaultValue={new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empresa">Empresa</Label>
              <Select name="empresa" required>
                <SelectTrigger id="empresa"><SelectValue placeholder="Seleccione Empresa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Achs">ACHS</SelectItem>
                  <SelectItem value="Esachs">ESACHS</SelectItem>
                  <SelectItem value="CMT">CMT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo de Incidente</Label>
              <Select name="tipo" required>
                <SelectTrigger id="tipo"><SelectValue placeholder="Seleccione Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Aplicaciones">Aplicaciones</SelectItem>
                  <SelectItem value="Red">Red</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select name="prioridad" defaultValue="media" required>
                <SelectTrigger id="prioridad"><SelectValue placeholder="Prioridad" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">BAJA</SelectItem>
                  <SelectItem value="media">MEDIA</SelectItem>
                  <SelectItem value="alta">ALTA</SelectItem>
                  <SelectItem value="urgente">URGENTE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tecnico">Técnico Asignado</Label>
              <Select name="tecnico" required>
                <SelectTrigger id="tecnico"><SelectValue placeholder="Seleccione Técnico" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Miguel Chervellino">M.Chervellino</SelectItem>
                  <SelectItem value="Christian Torrenss">C. Torrens</SelectItem>
                  <SelectItem value="jerson Armijo">J. Armijo</SelectItem>
                  <SelectItem value="No Asignado">No Asignado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ubicacion">Ubicación (Ej: Oficina, Piso, Ciudad)</Label>
              <Input name="ubicacion" id="ubicacion" placeholder="Detalle de la ubicación" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contacto">Contacto Solicitante (Nombre/Email)</Label>
              <Input name="contacto" id="contacto" placeholder="Persona que reporta" required />
            </div>
            
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="tituloDelTicket">Título del Ticket (Resumen Breve)</Label>
              <Input name="tituloDelTicket" id="tituloDelTicket" placeholder="Ej: Impresora no enciende en Contabilidad" required />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="detalleAdicional">Descripción Detallada del Problema</Label>
              <Textarea name="detalleAdicional" id="detalleAdicional" placeholder="Proporciona todos los detalles relevantes: qué ocurre, cuándo, mensajes de error, pasos para reproducirlo, etc." rows={5}/>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="accionInicial">Acción Inicial Realizada (Si aplica)</Label>
              <Textarea name="accionInicial" id="accionInicial" placeholder="Si ya realizaste alguna acción para intentar solucionar o diagnosticar, descríbela aquí." rows={3}/>
            </div>

            <div className="md:col-span-2 space-y-1.5"> {/* Ocupa todo el ancho para mejor visualización */}
              <Label htmlFor="fechaSolucion">Fecha Estimada/Solución (Opcional)</Label>
              <Input type="date" name="fechaSolucion" id="fechaSolucion" />
            </div>
          </div>
          <CardFooter className="px-0 pt-8 flex justify-end gap-3"> {/* Aumentado pt y gap */}
            <Button variant="outline" type="reset">Limpiar Campos</Button>
            <Button type="submit">Guardar Ticket</Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
