//Importar la función para responder a las peticiones
import { NextResponse } from "next/server";
//Importar la función para conectar a la base de datos
import { connectDB } from "@/utils/mongoose";

export function GET() {
  connectDB();
  return NextResponse.json({
    message: "Hello World!",
  });
}
