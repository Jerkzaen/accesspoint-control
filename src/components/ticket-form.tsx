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
//  Importar el componente de select de la aplicacion
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { redirect } from "next/navigation";
import { connectDB } from "@/utils/mongoose";
import Ticket from "@/models/Ticket";

async function loadTickets() {
  //conexion a la base de datos
  connectDB();
  //buscar todos los tickets en la base de datos
  const tickets = await Ticket.find();
  //retornar los tickets
  return tickets;
}

// Definir el componente de formulario de ticket para crear un nuevo ticket en la aplicacion
export async function TicketForm() {
  // Funcion para crear un ticket en el servidor
  async function newTicket(formdata: FormData) {
    "use server";
    const nroCaso = formdata.get("nroCaso")?.toString();
    const empresa = formdata.get("empresa")?.toString();
    const prioridad = formdata.get("prioridad")?.toString();
    const tecnico = formdata.get("tecnico")?.toString();
    const tipo = formdata.get("tipo")?.toString();
    const titulo = formdata.get("titulo")?.toString();
    const idNotebook = formdata.get("idNotebook")?.toString();
    const ubicacion = formdata.get("ubicacion")?.toString();
    const contacto = formdata.get("contacto")?.toString();
    const createdAt = formdata.get("createdAt")?.toString();
    const descripcion = formdata.get("descripcion")?.toString();
    const accion = formdata.get("accion")?.toString();
    const fechaSolucion = formdata.get("fechaSolucion")?.toString();

    console.log({
      nroCaso,
      createdAt,
      empresa,
      prioridad,
      tecnico,
      tipo,
      titulo,
      idNotebook,
      ubicacion,
      contacto,
      descripcion,
      accion,
      fechaSolucion,
    });

    // Verificar si el titulo, la descripcion y la prioridad del ticket no estan vacios
    if (
      !nroCaso ||
      !empresa ||
      !prioridad ||
      !tecnico ||
      !tipo ||
      !titulo ||
      !idNotebook ||
      !ubicacion ||
      !contacto ||
      !descripcion ||
      !accion
    ) {
      return;
    }
    // Enviar una peticion POST al servidor para crear un nuevo ticket
    try {
      const res = await fetch("http://localhost:3000/api/tickets", {
        method: "POST",
        body: JSON.stringify({
          nroCaso,
          createdAt,
          empresa,
          prioridad,
          tecnico,
          tipo,
          titulo,
          idNotebook,
          ubicacion,
          contacto,
          descripcion,
          accion,
          fechaSolucion,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      // Manejar errores de la respuesta del servidor

      if (!res.ok) {
        throw new Error(res.statusText);
      }
      // Convertir la respuesta del servidor a un objeto JSON
      const data = await res.json();
      console.log(data);
    } catch (error) {
      console.error("Error:", error);
    }
    redirect("/tickets/dashboard");
  }
  // Renderizar el formulario de ticket
  const tickets = await loadTickets();
  return (
    <form action={newTicket}>
      <Card className="w-[600px]">
        <CardHeader>
          <CardTitle>Crear nuevo ticket</CardTitle>
          <CardDescription>Ingresa la descripcion del problema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="nroCaso">N° de Caso</Label>
              <Input
                name="nroCaso"
                id="nroCaso"
                defaultValue={
                  tickets.length > 0
                    ? tickets[tickets.length - 1].nroCaso + 1
                    : 1
                }
                readOnly
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="empresa">Empresa</Label>
              <Select name="empresa">
                <SelectTrigger id="empresa">
                  <SelectValue placeholder="Seleccione Empresa" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="Achs">Achs</SelectItem>
                  <SelectItem value="Esachs">Esachs</SelectItem>
                  <SelectItem value="CMT">CMT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label className="prioridad" htmlFor="prioridad">
                Prioridad
              </Label>
              <Select name="prioridad">
                <SelectTrigger id="prioridad">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="tecnico">Tecnico</Label>
              <Select name="tecnico">
                <SelectTrigger id="tecnico">
                  <SelectValue placeholder="Seleccione Tecnico" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="cTorrens">C. Torrens</SelectItem>
                  <SelectItem value="jArmijo">J. Armijo</SelectItem>
                  <SelectItem value="cCheverllino">D. Cherve</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="tipo">Tipo</Label>
              <Input name="tipo" id="tipo" placeholder="Tipo" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="titulo">Titulo</Label>
              <Input name="titulo" id="titulo" placeholder="Titulo" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="idNotebook">ID Notebook</Label>
              <Input
                name="idNotebook"
                id="idNotebook"
                placeholder="ID Notebook"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="ubicacion">Ubicacion</Label>
              <Input name="ubicacion" id="ubicacion" placeholder="Ubicacion" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="contacto">Contacto</Label>
              <Input name="contacto" id="contacto" placeholder="Contacto" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="createdAt">Fecha Reporte</Label>
              <Input
                name="createdAt"
                value={new Date().toLocaleDateString()}
                readOnly
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="descripcion">Descripcion</Label>
              <Input
                name="descripcion"
                id="descripcion"
                placeholder="Descripcion"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="accion">Accion</Label>
              <Textarea
                name="accion"
                id="accion"
                placeholder="Accion realizada"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="fechaSolucion">Fecha Solucion</Label>
              <Input
                name="fechaSolucion"
                id="fechaSolucion"
                defaultValue={new Date().toLocaleDateString()}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancelar</Button>
          <Button type="submit">Guardar</Button>
        </CardFooter>
      </Card>
    </form>
  );
}
