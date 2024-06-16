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
    <div className=" flex flex-auto flex-col sm:w-[45%] bg-gray-300 min-h-[45%] relative">
          <div className="flex flex-row-3 flex-wrap">

            <Card>
                <CardHeader className="flex  pb-2">
                  <CardTitle>Crear Ticket</CardTitle>
                  <CardDescription className="flex flex-grow">
                    Para crear un ticket de soporte, haz clic en el botón de
                    abajo.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link href="/tickets/new">
                    <Button>Crear Nuevo Ticket</Button>
                  </Link>
                </CardFooter>
              </Card>
              <Card>
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
              <Card>
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
