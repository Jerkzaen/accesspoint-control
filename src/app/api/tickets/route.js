import { NextResponse } from "next/server";
import { connectDB } from "@/utils/mongoose";
import Ticket from "@/models/Ticket";

//CRUD

// OBTENER TODOS LOS TICKETS
export async function GET() {
  // Conectar a la base de datos de MongoDB
  connectDB();
  // Obtener todos los tickets de la base de datos
  const tickets = await Ticket.find();
  // Devolver los tickets
  return NextResponse.json(tickets);
}

// CREAR UN TICKET
export function POST() {
  return NextResponse.json({
    message: "Creando un ticket",
  });
}
