import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

//Interface para obtener el id del producto
interface Params {
  params: { id: string };
}

// Obtener un producto por id
export async function GET(request: Request, { params }: Params) {
  try {
    const producto = await prisma.stock.findFirst({
        where: { idProducto: Number(params.id) },
      });
      return NextResponse.json(producto);
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    
  }
}

//Eliminar un producto por id
export function DELETE(request: Request) {
  return NextResponse.json({ message: "Eliminando un elemento api/stock" });
}

//Actualizar un producto por id
export function PUT(request: Request) {
  return NextResponse.json({ message: "Actualizando un elemento api/stock" });
}
