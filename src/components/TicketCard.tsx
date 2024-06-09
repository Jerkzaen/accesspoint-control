// aqui es donde se crea el formato del ticket donde muestra 2 datos el titulo y la descripcion del ticket
// Importar React y el hook de estado de React para la aplicacion

import { ReactNode } from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHead,
} from "./ui/table";

// Definir la  interfaz de ticket para el componente de tarjeta de ticket
interface Ticket {
  _id: ReactNode;
  nroCaso: string;
  empresa: string;
  prioridad: string;
  tecnico: string;
  tipo: string;
  titulo: string;
  idNotebook: string;
  ubicacion: string;
  contacto: string;
  createdAt: string;
  descripcion: string;
  accion: string;
  fechaSolucion: string;
}


// Definir el componente de la tarjeta de ticket  en el dashboard del usuario logeado en la aplicacion
function TaskCard({ ticket }: { ticket: Ticket }) {
  // Renderiza el componente
  return (
    <div className="flex flex-grow-0 flex-shrink-1 relative">
    <Card  key={ticket.nroCaso} className="sticky">
      <CardHeader className="px-7">
        <CardTitle>ID Caso</CardTitle>
        <CardDescription>{ticket._id}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table className="flex flex-col justify-normal flex-grow-0 flex-shrink-1 sm:table-cell ">
          <TableHeader>
            <TableRow>
              <TableHead className="hidden sm:table-cell">N° Caso</TableHead>
              <TableHead className="hidden sm:table-cell">Empresa</TableHead>
              <TableHead className="hidden sm:table-cell">Prioridad</TableHead>
              <TableHead className="hidden sm:table-cell">Tecnico</TableHead>
              <TableHead className="hidden sm:table-cell">Tipo</TableHead>
              <TableHead className="hidden sm:table-cell">Titulo</TableHead>
              <TableHead className="hidden sm:table-cell">Id Notebook</TableHead>
              <TableHead className="hidden sm:table-cell">Ubicacion</TableHead>
              <TableHead className="hidden sm:table-cell">Contacto</TableHead>
              <TableHead className="hidden sm:table-cell">Fecha Creacion</TableHead>
              <TableHead className="hidden sm:table-cell">Descripcion</TableHead>
              <TableHead className="hidden sm:table-cell">Accion</TableHead>
              <TableHead className="hidden sm:table-cell ">Fecha Solucion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-accent">
              <TableCell>
              <div id="nroCaso" className="font-medium">{ticket.nroCaso}</div>
              </TableCell>
              <TableCell>
                <div  id="empresa" className="font-medium">
              {ticket.empresa}</div></TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge className="text-xs" variant="secondary">
                  {ticket.prioridad}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {ticket.tecnico}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {ticket.tipo}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {ticket.titulo}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {ticket.idNotebook}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {ticket.ubicacion}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {ticket.contacto}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
              {ticket.createdAt
                ? new Date(ticket.createdAt).toLocaleDateString()
                : ""}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {ticket.descripcion}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {ticket.accion}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
              {ticket.fechaSolucion ? new Date(ticket.fechaSolucion).toLocaleDateString() : ""}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </div>
  )
}

 
// Exporta el componente
export default TaskCard;
