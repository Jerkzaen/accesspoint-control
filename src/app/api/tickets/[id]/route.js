// Importar la función para responder a las peticiones
import { NextResponse } from "next/server";
// Importar la función para conectar a la base de datos
import { connectDB } from "@/utils/mongoose";
// Importar el modelo de Ticket
import Ticket from "@/models/Ticket";

//CRUD

// Obteniendo un ticket por su ID
export async function GET(request, { params }) {
  try {
    // Conectar a la base de datos de MongoDB
    connectDB();
    // Buscar un ticket por su ID
    const ticketFound = await Ticket.findById(params.id);
    // Devolver un mensaje si no se encontró el ticket
    if (!ticketFound) {
      return NextResponse.json(
        {
          message: `No se encontró un ticket con el ID ${params.id}`,
        },
        {
          status: 404,
        }
      );
    }
    // Devolver el ticket encontrado
    return NextResponse.json(ticketFound);
  } catch (error) {
    // Devolver un mensaje de error si no se pudo obtener el ticket
    return NextResponse.json(error.message, {
      status: 400,
    });
  }
}

// Eliminar un ticket
export function DELETE(request, { params }) {
  return NextResponse.json({
    message: `Eliminando un ticket ${params.id}`,
  });
}

// Actualizar un ticket
export async function PUT(request, { params }) {
  try {
    // Datos del ticket a actualizar en el body de la petición
    const data = await request.json();
    // Actualizar un ticket por su ID con los datos del body
    const ticketUpdated = await Ticket.findByIdAndUpdate(params.id, data, {
      new: true,
    });
    // Devolver un mensaje si no se encontró el ticket
    return NextResponse.json(ticketUpdated);
  } catch (error) {
    // Devolver un mensaje de error si no se pudo actualizar el ticket
    return NextResponse.json(error.message, {
      status: 400,
    });
  }
}
