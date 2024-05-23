import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// Definir el componente de formulario de ticket para crear un nuevo ticket en la aplicacion
export function TicketForm() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Crear nuevo ticket</CardTitle>
        <CardDescription>Ingresa la descripcion del problema</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Problema" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select>
                <SelectTrigger id="prioridad">
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
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancelar</Button>
        <Button>Guardar</Button>
      </CardFooter>
    </Card>
  )
}
