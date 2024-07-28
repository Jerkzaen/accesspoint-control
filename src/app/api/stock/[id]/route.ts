import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ message: "Obteniendo un elemento api/stock" });
}

export function DELETE() {
  return NextResponse.json({ message: "Eliminando un elemento api/stock" });
}

export function PUT() {
  return NextResponse.json({ message: "Actualizando un elemento api/stock" });
}