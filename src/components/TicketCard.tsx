// aqui es donde se crea el formato del ticket donde muestra 2 datos el titulo y la descripcion del ticket
// Importar React y el hook de estado de React para la aplicacion

import { Badge } from "./ui/badge";
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
  nroCaso: number;
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="">Numero de Caso </TableHead>
          <TableHead className="">Empresa</TableHead>
          <TableHead className="">Tecnico</TableHead>
          <TableHead className="">Prioridad</TableHead>
          <TableHead className="">Tipo</TableHead>
          <TableHead className="">ID Notebook</TableHead>
          <TableHead className="">Ubicacion</TableHead>
          <TableHead className="">Contacto</TableHead>
          <TableHead className="">Fecha de Creacion</TableHead>
          <TableHead className="">Descripcion</TableHead>
          <TableHead className="">Accion</TableHead>
          <TableHead className="">Fecha de Solucion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody key={ticket.nroCaso}>
        <TableRow className="bg-accent">
          <TableCell>
            <div className="font-medium">{ticket.nroCaso}</div>
          </TableCell>
          <TableCell>
            <div className="hidden text-sm text-muted-foreground md:inline">
              {ticket.empresa}
            </div>
          </TableCell>
          <TableCell>
            <div className="hidden text-sm text-muted-foreground md:inline">
              {ticket.tecnico}
            </div>
          </TableCell>
          <TableCell>
            <Badge>{ticket.prioridad}</Badge>
          </TableCell>
          <TableCell>
            <Badge>{ticket.tipo}</Badge>
          </TableCell>
          <TableCell>
            <Badge>{ticket.idNotebook}</Badge>
          </TableCell>
          <TableCell>
            <Badge>{ticket.ubicacion}</Badge>
          </TableCell>
          <TableCell>
            <div className="hidden text-sm text-muted-foreground md:inline">
              {ticket.contacto}
            </div>
          </TableCell>
          <TableCell>
            <Badge>
              {ticket.createdAt
                ? new Date(ticket.createdAt).toLocaleDateString()
                : ""}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="hidden text-sm text-muted-foreground md:inline">
              {ticket.descripcion}
            </div>
          </TableCell>
          <TableCell>
            <div className="hidden text-sm text-muted-foreground md:inline">
              {ticket.accion}
            </div>
          </TableCell>
          <TableCell>
            <div className="hidden text-sm text-muted-foreground md:inline">
              {ticket.fechaSolucion ? new Date(ticket.fechaSolucion).toLocaleDateString() : ""}
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
// Exporta el componente
export default TaskCard;
