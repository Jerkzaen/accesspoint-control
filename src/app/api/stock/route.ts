import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

//Obtener todos los productos
export async function GET() {
  try {
    const stock = await prisma.stock.findMany();
    return NextResponse.json(stock);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }
}

//Crear un nuevo producto
export async function POST(request: Request) {
  try {
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
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }
}
