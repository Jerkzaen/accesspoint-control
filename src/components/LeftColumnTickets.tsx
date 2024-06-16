import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "./ui/button";

import { connectDB } from "@/utils/mongoose";
import Ticket from "@/models/Ticket";
import TaskCard from "./TicketCard";

// Funcion para cargar los tickets de la base de datos
async function loadTickets() {
  //conexion a la base de datos
  connectDB();
  //buscar todos los tickets en la base de datos
  const tickets = await Ticket.find();
  //retornar los tickets
  return tickets;
}

const LeftColumnTickets = async () => {
  const tickets = await loadTickets();
  return (
   <div className="flex flex-auto flex-col bg-gray-300 relative">
  {/* Cambia a grid layout con 1 columna en pantallas pequeñas y 3 columnas en pantallas más grandes */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card className="flex flex-col"> {/* Asegúrate de que Card sea un contenedor flex para manejar el contenido internamente */}
      <CardHeader className="flex pb-2">
        <CardTitle>Crear Ticket</CardTitle>
      </CardHeader>
      <CardFooter>
        <Link href="/tickets/new">
          <Button>Crear Nuevo Ticket</Button>
        </Link>
      </CardFooter>
    </Card>
    <Card className="flex flex-col">
      <CardHeader className="pb-2 items-center">
        <CardDescription>Total Tickets</CardDescription>
        <CardTitle className="text-4xl"></CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground text-center">
          Total a la fecha
        </div>
        <div className="text-xs text-muted-foreground text-center"></div>
      </CardContent>
    </Card>
    <Card className="flex flex-col">
      <CardHeader className="pb-2 items-center">
        <CardDescription>Tickets Activos</CardDescription>
        <CardTitle className="text-4xl">4</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground text-center">
          Sin resolver
        </div>
      </CardContent>
    </Card>
  </div>
  <div className="flex flex-shrink">
    <TaskCard ticket={tickets[0]} />
  </div>
</div>
  );
};

export default LeftColumnTickets;
