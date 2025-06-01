import * as React from "react";
// Importar el componente de formulario de ticket para crear un nuevo ticket en la aplicacion
import { Textarea } from "@/components/ui/textarea";
// Importar el componente de boton de la aplicacion
import { Button } from "@/components/ui/button";
// Importar el componente de tarjeta de la aplicacion
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Importar el componente de input de la aplicacion
import { Input } from "@/components/ui/input";
// Importar el componente de etiqueta de la aplicacion
import { Label } from "@/components/ui/label";
// Importar el componente de select de la aplicacion
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

// Interfaz para el ticket (asegúrate de que coincida exactamente con tu schema.prisma)
interface Ticket {
  id: string;
  nroCaso: number;
  empresa: string;
  ubicacion: string;
  contacto: string;
  prioridad: string;
  tecnico: string;
  tipo: string;
  descripcion: string; // Este es el campo 'Titulo' del CSV / Lo que el usuario ingresa en el campo "Título" del form
  acciones: string; // Como String JSON
  estado: string;
  fechaSolucion: Date | null;
  createdAt: Date;
  // Considera si necesitas un campo para la descripción detallada en tu schema, ej:
  // detalleAdicional?: string;
}

// Modifica loadTickets para usar Prisma
async function loadTickets(): Promise<Ticket[]> {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { nroCaso: "desc" },
    });
    return tickets as Ticket[];
  } catch (error) {
    console.error("Error al cargar tickets con Prisma:", error);
    return [];
  }
}

// Definir el componente de formulario de ticket para crear un nuevo ticket en la aplicacion
export async function TicketForm() {
  // Funcion para crear un ticket en el servidor
  async function newTicket(formdata: FormData) {
    "use server";

    const nroCaso = parseInt(formdata.get("nroCaso")?.toString() || "0");
    const empresa = formdata.get("empresa")?.toString() || "";
    const prioridad = formdata.get("prioridad")?.toString() || "";
    const tecnico = formdata.get("tecnico")?.toString() || "";
    const tipo = formdata.get("tipo")?.toString() || "";
    const tituloInput = formdata.get("titulo")?.toString() || "";
    const descripcionDetalladaInput = formdata.get("descripcion")?.toString() || "";
    const idNotebook = formdata.get("idNotebook")?.toString() || "";
    const ubicacion = formdata.get("ubicacion")?.toString() || "";
    const contacto = formdata.get("contacto")?.toString() || "";
    const createdAtForm = formdata.get("createdAt")?.toString();
    const accionInput = formdata.get("accion")?.toString() || "";
    const fechaSolucionForm = formdata.get("fechaSolucion")?.toString();

    // Validar campos obligatorios
    if (
      !nroCaso ||
      !empresa ||
      !prioridad ||
      !tecnico ||
      !tipo ||
      !tituloInput ||
      !ubicacion ||
      !contacto
    ) {
      console.error("Faltan campos obligatorios para el ticket (incluyendo el Título).");
      // Modificación: Se elimina el retorno de un objeto { error: "..." }
      // para cumplir con la firma esperada por <form action={...}> (void | Promise<void>)
      return;
    }

    const accionesArray = [];
    if (accionInput.trim()) {
      accionesArray.push({
        fecha: new Date().toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }),
        descripcion: accionInput,
      });
    }
    const accionesParaGuardar = JSON.stringify(accionesArray);

    const createdAtDate = createdAtForm ? new Date(`${createdAtForm}T00:00:00`) : new Date();
    const fechaSolucionDate = fechaSolucionForm ? new Date(`${fechaSolucionForm}T00:00:00`) : null;

    const ticketData = {
      nroCaso: nroCaso,
      empresa: empresa,
      prioridad: prioridad,
      tecnico: tecnico,
      tipo: tipo,
      descripcion: tituloInput,
      ubicacion: ubicacion,
      contacto: contacto,
      acciones: accionesParaGuardar,
      createdAt: createdAtDate.toISOString(),
      fechaSolucion: fechaSolucionDate ? fechaSolucionDate.toISOString() : null,
      // detalleAdicional: descripcionDetalladaInput, // Si tienes este campo en tu schema
    };

    try {
      const res = await fetch("http://localhost:3000/api/tickets", {
        method: "POST",
        body: JSON.stringify(ticketData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || res.statusText || "Error al crear ticket desde API");
      }

      const data = await res.json();
      console.log("Ticket creado:", data);

      redirect("/tickets/dashboard");

    } catch (error: any) {
      if (error.digest && typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
        throw error;
      }
      console.error("Error al crear ticket (inesperado):", error.message);
    }
  }

  const tickets = await loadTickets();

  return (
    <form action={newTicket}>
      <Card className="w-[600px]">
        <CardHeader>
          <CardTitle>Crear nuevo ticket</CardTitle>
          <CardDescription>Ingresa la información del ticket</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="nroCaso">N° de Caso</Label>
              <Input
                name="nroCaso"
                id="nroCaso"
                defaultValue={
                  tickets.length > 0 && tickets[0]
                    ? tickets[0].nroCaso + 1
                    : 1
                }
                readOnly
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="empresa">Empresa</Label>
              <Select name="empresa" required>
                <SelectTrigger id="empresa">
                  <SelectValue placeholder="Seleccione Empresa" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="Achs">ACHS</SelectItem>
                  <SelectItem value="Esachs">ESACHS</SelectItem>
                  <SelectItem value="CMT">CMT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label className="prioridad" htmlFor="prioridad">
                Prioridad
              </Label>
              <Select name="prioridad" required>
                <SelectTrigger id="prioridad">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="baja">BAJA</SelectItem>
                  <SelectItem value="media">MEDIA</SelectItem>
                  <SelectItem value="alta">ALTA</SelectItem>
                  <SelectItem value="urgente">URGENTE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="tecnico">Técnico</Label>
              <Select name="tecnico" required>
                <SelectTrigger id="tecnico">
                  <SelectValue placeholder="Seleccione Tecnico" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="Miguel Chervellino">M.Chervellino</SelectItem>
                  <SelectItem value="Christian Torrenss">C. Torrens</SelectItem>
                  <SelectItem value="jerson Armijo">J. Armijo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="tipo">Tipo</Label>
              <Select name="tipo" required>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Seleccione Tipo" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Aplicaciones">Aplicaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="titulo">Título</Label>
              <Input name="titulo" id="titulo" placeholder="Título breve del problema" required />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="idNotebook">ID Notebook</Label>
              <Input
                name="idNotebook"
                id="idNotebook"
                placeholder="ID Notebook (Opcional)"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input name="ubicacion" id="ubicacion" placeholder="Ubicación" required />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="contacto">Contacto</Label>
              <Input name="contacto" id="contacto" placeholder="Nombre o email de contacto" required />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="createdAt">Fecha Reporte</Label>
              <Input type="date"
                name="createdAt"
                id="createdAt"
                defaultValue={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="descripcion">Descripción Detallada</Label>
              <Textarea
                name="descripcion"
                id="descripcion"
                placeholder="Descripción detallada del problema (Opcional)"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="accion">Acción Inicial</Label>
              <Textarea
                name="accion"
                id="accion"
                placeholder="Acción inicial realizada (Opcional)"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="fechaSolucion">Fecha Solución</Label>
              <Input type="date"
                name="fechaSolucion"
                id="fechaSolucion"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="reset">Limpiar</Button>
          <Button type="submit">Guardar</Button>
        </CardFooter>
      </Card>
    </form>
  );
}