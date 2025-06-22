// src/app/api/admin/importar-tickets/route.ts

import { NextResponse } from "next/server";
import { TicketService } from "@/services/ticketService"; // Importar TicketService
import { Prisma } from "@prisma/client";

/**
 * POST handler para la importación masiva de tickets.
 * Asume que el cuerpo de la solicitud es un array de objetos de tickets.
 * @param request La solicitud Next.js, conteniendo un array de datos de tickets.
 * @returns Una respuesta JSON con el recuento de tickets importados o un mensaje de error.
 */
export async function POST(request: Request) {
  try {
    const ticketsToImport = await request.json(); // Se espera un array de TicketCreateInput
    if (!Array.isArray(ticketsToImport)) {
      return NextResponse.json(
        { message: "La solicitud debe contener un array de tickets." },
        { status: 400 }
      );
    }

    const result = await TicketService.importTicketsMassive(ticketsToImport);
    
    return NextResponse.json(
      { message: `Se importaron ${result.count} tickets exitosamente.`, count: result.count },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error en POST /api/admin/importar-tickets:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Puedes añadir manejo de errores específicos de Prisma si es necesario
      return NextResponse.json(
        { message: `Error de base de datos durante la importación: ${error.message}`, error: error.code },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Error al importar tickets masivamente", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
