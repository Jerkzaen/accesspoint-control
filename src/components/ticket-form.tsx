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

// Definir el componente de formulario de ticket para crear un nuevo ticket en la aplicacion
export function TicketForm() {
  // Funcion para crear un ticket en el servidor
  async function newTicket(formdata: FormData) {
    "use server";
    const title = formdata.get("title")?.toString();
    const description = formdata.get("description")?.toString();
    const priority = formdata.get("priority")?.toString();
    console.log({ title, description, priority });
    
    // Verificar si el titulo, la descripcion y la prioridad del ticket no estan vacios
    if (!title || !description || !priority) {
      return;
    }
    // Enviar una peticion POST al servidor para crear un nuevo ticket
    try {
      const res = await fetch("https://accesspoint-control.vercel.app/api/tickets", {
        method: "POST",
        body: JSON.stringify({ title, description, priority }),
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
    } redirect("/tickets/dashboard");
  }
  // Renderizar el formulario de ticket
  return (
    <form action={newTicket}>
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Crear nuevo ticket</CardTitle>
          <CardDescription>Ingresa la descripcion del problema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="title">Name</Label>
              <Input name="title" id="title" placeholder="Problema" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                name="description"
                id="description"
                placeholder="Descripcion"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label className="priority" htmlFor="priority">
                Prioridad
              </Label>
              <Select name="priority">
                <SelectTrigger id="priority">
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
