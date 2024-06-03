// aqui es donde se crea el formato del ticket donde muestra 2 datos el titulo y la descripcion del ticket
// Importar React y el hook de estado de React para la aplicacion

import { Badge } from "./ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

// Definir la  interfaz de ticket para el componente de tarjeta de ticket
interface Ticket {
  title: string;
  description: string;
  priority: string;
  createAt: string;
}
// Definir el componente de la tarjeta de ticket  en el dashboard del usuario logeado en la aplicacion
function TaskCard({ ticket }: { ticket: Ticket }) {
  // Renderiza el componente
  return (
    <Table>
      <TableBody key={ticket.title}>
        <TableRow className="bg-accent">
          <TableCell>
            <div className="font-medium">{ticket.title}</div>
            <div className="hidden text-sm text-muted-foreground md:inline">
              {ticket.description}
            </div>
          </TableCell>
          <TableCell className="hidden sm:table-cell">Sale</TableCell>
          <TableCell className="hidden sm:table-cell">
            <Badge className="text-xs" variant="secondary">
              {ticket.priority}
            </Badge>
          </TableCell>
          <TableCell className="hidden md:table-cell">
            {new Date(ticket.createAt).toDateString()}
          </TableCell>
          <TableCell className="text-center">J. amijo</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
// Exporta el componente
export default TaskCard;
