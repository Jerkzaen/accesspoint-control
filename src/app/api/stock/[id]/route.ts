import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
    if (!producto) {
      return NextResponse.json(
        { message: "Producto no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(producto);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }
}

//Eliminar un producto por id
export async function DELETE(request: Request, { params }: Params) {
  try {
    const deleteProduct = await prisma.stock.delete({
      where: { idProducto: Number(params.id) },
    });
    if (!deleteProduct) {
      return NextResponse.json(
        { message: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(deleteProduct);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Producto no encontrado" },
          { status: 404 }
        );
      }
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }
}

//Actualizar un producto por id
export function PUT(request: Request) {
  return NextResponse.json({ message: "Actualizando un elemento api/stock" });
}
