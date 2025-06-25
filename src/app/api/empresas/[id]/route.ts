// src/app/api/empresas/[id]/route.ts

import { EmpresaService } from "@/services/empresaService";
import { Prisma } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const empresa = await EmpresaService.getEmpresaById(params.id);
    if (!empresa) {
      return new Response(JSON.stringify({ message: "Empresa no encontrada" }), {
        status: 404,
      });
    }
    // Convertir fechas a string para que coincida con el mock del test
    const empresaJson = JSON.parse(JSON.stringify(empresa));
    return new Response(JSON.stringify(empresaJson), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Error al obtener empresa" }), {
      status: 500,
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const empresa = await EmpresaService.updateEmpresa(params.id, body);
    return new Response(JSON.stringify(empresa), { status: 200 });
  } catch (error: any) {
    // Manejo de error de validación Zod
    if (error.message && error.message.startsWith('Error de validación')) {
      return new Response(JSON.stringify({ message: error.message }), { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new Response(JSON.stringify({ message: 'Error al actualizar empresa: El RUT ya existe.' }), { status: 409 });
    }
    return new Response(JSON.stringify({ message: "Error al actualizar empresa" }), {
      status: 500,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await EmpresaService.deleteEmpresa(params.id);
    return new Response(JSON.stringify({ message: "Empresa eliminada exitosamente" }), {
      status: 200,
    });
  } catch (error: any) {
    if (error.message && error.message.includes("sucursales asociadas")) {
      return new Response(JSON.stringify({ message: error.message }), { status: 400 });
    }
    return new Response(JSON.stringify({ message: "Error al eliminar empresa" }), {
      status: 500,
    });
  }
}
