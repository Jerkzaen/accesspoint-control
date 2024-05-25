// Importar la función para responder a las peticiones
import { NextResponse } from "next/server";
// Importar la función para conectar a la base de datos
import { connectDB } from "@/utils/mongoose";
// Importar el modelo de Ticket
import Ticket from "@/models/Ticket";

//CRUD

// Obtener todos los tickets
export async function GET() {
  // Conectar a la base de datos de MongoDB
  connectDB();
  // Obtener todos los tickets de la base de datos
  const tickets = await Ticket.find();
  // Devolver los tickets
  return NextResponse.json(tickets);
}

// Crear un ticket
export async function POST(request) {
  try {
    // Datos del ticket a crear en el body de la petición
    const data = await request.json();
    // Crear un nuevo ticket con los datos del body
    const newTicket = new Ticket(data);
    // Guardar el ticket en la base de datos
    const saveTicket = await newTicket.save();
    // Devolver datos del ticket creado
    console.log(saveTicket);
    // Devolver el ticket creado en formato JSON
    return NextResponse.json(saveTicket);
  } catch (error) {
    // Devolver un mensaje de error si no se pudo crear el ticket
    return NextResponse.json(error.message, {
      status: 400,
    });
  }
}
