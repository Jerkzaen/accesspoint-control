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
import { create } from "domain";

// Definir el componente de formulario de ticket para crear un nuevo ticket en la aplicacion
export function TicketForm() {
  // Funcion para crear un ticket en el servidor
  async function newTicket(formdata: FormData) {
    "use server";
    const name = formdata.get("name")?.toString();
    const description = formdata.get("description")?.toString();
    const priority = formdata.get("priority")?.toString();
    console.log({ name, description, priority });

    // Enviar los datos al servidor para crear un nuevo ticket
    const res = await fetch("http://localhost:3000/api/tickets", {
      method: "POST",
      body: JSON.stringify({name, description, priority}),
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(res);
  }

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
              <Label htmlFor="name">Name</Label>
              <Input name="name" id="name" placeholder="Problema" />
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
                  <SelectItem value="maja">Baja</SelectItem>
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
