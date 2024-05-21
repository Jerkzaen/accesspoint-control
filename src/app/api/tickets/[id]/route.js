import { NextResponse } from "next/server";

// OBTENER UN TICKET
export function GET() {
  return NextResponse.json({
    message: "Obteniendo un ticket",
  });
}