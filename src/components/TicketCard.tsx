// aqui es donde se crea el formato del ticket donde muestra 2 datos el titulo y la descripcion del ticket
// Importar React y el hook de estado de React para la aplicacion
import { Badge } from "./ui/badge";
import {
  Card,
} from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHead,
  TableFooter,
  TableCaption,
} from "./ui/table";
import Ticket from "@/models/Ticket";
import { connectDB } from "@/utils/mongoose";

// Funcion para cargar los tickets de la base de datos
async function loadTickets() {
  //conexion a la base de datos
  connectDB();
  //buscar todos los tickets en la base de datos
  const tickets = await Ticket.find();
  //retornar los tickets
  return tickets;
}

// Definir la  interfaz de ticket para el componente de tarjeta de ticket
interface Ticket {  
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
async function TaskCard() {
  
  const tickets = await loadTickets();
  // Renderiza el componente
return (
<div className="flex flex-grow flex-shrink flex-wrap h-full p-4"> {/* Añade h-full para altura completa y p-4 para un margen interno */}
  <Card className="w-full h-full"> {/* Asegura que Card ocupe todo el ancho y altura disponibles */}
    <Table className="min-w-full">
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs lg:text-sm px-1 lg:px-3 text-center">
            Nro Caso
          </TableHead>
          <TableHead className="text-xs lg:text-sm px-1 lg:px-3 text-center">
            Empresa
          </TableHead>
          <TableHead className="text-xs lg:text-sm px-1 lg:px-3 text-center">
            Prioridad
          </TableHead>
          <TableHead className="text-xs lg:text-sm px-1 lg:px-3 text-center">
            Tecnico
          </TableHead>
          <TableHead className="text-xs lg:text-sm px-1 lg:px-3 text-center">
            Descripcion
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.nroCaso}>
            <TableCell className="text-xs lg:text-sm px-1 lg:px-3 text-center">
              {ticket.nroCaso}
            </TableCell>
            <TableCell className="text-xs lg:text-sm px-1 lg:px-3 text-center">
              {ticket.empresa}
            </TableCell>
            <TableCell className="text-xs lg:text-sm px-1 lg:px-3 text-center">
              {ticket.prioridad}
            </TableCell>
            <TableCell className="text-xs lg:text-sm px-1 lg:px-3 text-center">
              {ticket.tecnico}
            </TableCell>
            <TableCell className="text-xs lg:text-sm px-1 lg:px-3 text-center">
              {ticket.descripcion}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow></TableRow>
      </TableFooter>
    </Table>
  </Card>
</div>
);
}

// Exporta el componente
export default TaskCard;
