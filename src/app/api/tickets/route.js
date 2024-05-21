import { NextResponse } from "next/server";
import { connectDB } from "@/utils/mongoose";

//CRUD 

// OBTENER TODOS LOS TICKETS
export function GET() {
  connectDB();
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