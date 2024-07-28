import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const stock = await prisma.stock.findMany();
  return NextResponse.json(stock);
}

export async function POST(request: Request) {
  const {
    nombrePrducto,
    marcaProducto,
    modeloProducto,
    serieProducto,
    estadoProducto,
    ultimoEquipo,
  } = await request.json();

  const newProduct = await prisma.stock.create({
    data: {
      nombrePrducto,
      marcaProducto,
      modeloProducto,
      serieProducto,
      estadoProducto,
      ultimoEquipo,
    },
  });

  return NextResponse.json(newProduct);
}
