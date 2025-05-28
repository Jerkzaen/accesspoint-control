// aqui es donde se crea el formato del ticket donde muestra 2 datos el titulo y la descripcion del ticket
// Importar React y el hook de estado de React para la aplicacion

import { Card } from "./ui/card";
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
    <div className="flex flex-grow flex-shrink flex-wrap h-full p-4 gap-4">
      {" "}
      {/* Añade h-full para altura completa, p-4 para un margen interno y gap-4 para espacio entre cards */}
      <Card
        className="flex-grow shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg p-4"
        style={{ width: "calc(70% - 1rem)" }}
      >
        {" "}
        {/* Ajusta el Card de la izquierda para que ocupe el 90% del espacio disponible y añade padding */}
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
                Ubicacion
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
            {tickets
              .sort((a, b) => b.nroCaso - a.nroCaso)
              .map((ticket) => (
                <TableRow key={ticket.nroCaso}>
                  <TableCell className="text-xs lg:text-sm px-1 lg:px-3 text-center">
                    {ticket.nroCaso}
                  </TableCell>
                  <TableCell className="text-xs lg:text-sm px-1 lg:px-3 text-center">
                    {ticket.empresa}
                  </TableCell>
                  <TableCell className="text-xs lg:text-sm px-1 lg:px-3 text-center">
                    {ticket.ubicacion}
                  </TableCell>
                  <TableCell className="text-xs lg:text-sm px-1 lg:px-3 text-center">
                    {ticket.tecnico}
                  </TableCell>
                  <TableCell
                    style={{
                      maxWidth: "50px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
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
      <Card
        className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg p-4"
        style={{ width: "30%" }}
      >
        {" "}
        {/* Añade el Card de la derecha para que ocupe el 10% del espacio disponible y añade padding */}
        <div className="flex flex-col h-full">
          <div className="mb-4">
            <span className="text-sm font-semibold">
              Última actualización: 12/12/2021
            </span>
          </div>
          <div className="mb-4">
            <span className="text-sm font-semibold">
              Accion
            </span>
          </div>
          <textarea
            className="flex-1 p-2 border border-gray-300 rounded-lg resize-none cursor-default"
            readOnly
          ></textarea>
        </div>
      </Card>
    </div>
  );
}

// Exporta el componente
export default TaskCard;

