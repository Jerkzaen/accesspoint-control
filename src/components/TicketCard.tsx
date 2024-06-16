// aqui es donde se crea el formato del ticket donde muestra 2 datos el titulo y la descripcion del ticket
// Importar React y el hook de estado de React para la aplicacion
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  _id: string;
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
async function TaskCard({ ticket }: { ticket: Ticket }) {
  let idPlano = JSON.parse(JSON.stringify(ticket._id));
  const tickets = await loadTickets();
  // Renderiza el componente
  return (
    <div  className="flex flex-shrink flex-grow flex-auto ">
      <Card >
      <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow >
          <TableHead>Nro Caso</TableHead>
          <TableHead>Empresa</TableHead>
          <TableHead>Prioridad</TableHead>
          <TableHead>Tecnico</TableHead>
          <TableHead>Descripcion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.nroCaso} >
            <TableCell >{ticket.nroCaso}</TableCell>
            <TableCell >{ticket.empresa}</TableCell>
            <TableCell >{ticket.prioridad}</TableCell>
            <TableCell >{ticket.tecnico}</TableCell>
            <TableCell >{ticket.descripcion}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
        </TableRow>
      </TableFooter>
    </Table>
      </Card>
    </div>
  );
}

// Exporta el componente
export default TaskCard;