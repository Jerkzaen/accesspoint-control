import { NextResponse } from "next/server";

//CRUD 

// OBTENER TODOS LOS TICKETS
export function GET() {
  return NextResponse.json({
    message: "Obteniendo tickets",
  });
}

// CREAR UN TICKET
export function POST() {
  return NextResponse.json({
    message: "Creando un ticket",
  });
}