import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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

import TaskCard from "@/components/TicketCard";
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

async function Dashboard() {
  const tickets = await loadTickets();
  return (
    <div className="flex flex-col bg-slate-900">
      <div className="flex flex-col gap-4 py-4 pl-4 mt-4 ">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="#">Tickets</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="#">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            />
          </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 px-2 ">
              <Card className="sm:col-span-2" x-chunk="dashboard-05-chunk-0 ">
                <CardHeader className="pb-2">
                  <CardTitle>Crear Ticket</CardTitle>
                  <CardDescription className="max-w-lg text-balance leading-relaxed ">
                    Para crear un ticket de soporte, haz clic en el botón de
                    abajo.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button>Crear Nuevo Ticket</Button>
                </CardFooter>
              </Card>
              <Card x-chunk="dashboard-05-chunk-1">
                <CardHeader className="pb-2 items-center">
                  <CardDescription>Total Tickets</CardDescription>
                  <CardTitle className="text-4xl">{tickets.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground text-center">
                    Total a la fecha
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    {new Date().toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
              <Card x-chunk="dashboard-05-chunk-2">
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
            <div className="flex flex-col-reverse px-2 py-2   ">
              {tickets.map((ticket) => (
                <div className="flex flex-col-reverse px-2 py-2 flex-grow-0 flex-shrink-1" key={ticket.nroCaso}>
                  <TaskCard ticket={ticket} />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
export default Dashboard;
