// RUTA: src/app/api/empresas/[id]/route.ts

import { EmpresaService } from "@/services/empresaService";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
// 1. --- IMPORTAMOS getServerSession ---
import { getServerSession } from "next-auth/next";

/**
 * GET handler para obtener una empresa por su ID.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const empresa = await EmpresaService.getEmpresaById(params.id);
    if (!empresa) {
      return NextResponse.json({ message: "Empresa no encontrada" }, {
        status: 404,
      });
    }
    return NextResponse.json(empresa, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error al obtener empresa" }, {
      status: 500,
    });
  }
}

/**
 * PUT handler para actualizar una empresa por su ID.
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    // 3. --- CORRECCIÓN ---
    // Ahora pasamos el 'id' y el 'body' como dos argumentos separados,
    // tal como lo espera la función 'updateEmpresa' en tu servicio.
    const empresa = await EmpresaService.updateEmpresa(params.id, body);
    return NextResponse.json(empresa, { status: 200 });
  } catch (error: any) {
    if (error.message && error.message.startsWith('Error de validación')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'Error al actualizar empresa: El RUT ya existe.' }, { status: 409 });
    }
    return NextResponse.json({ message: "Error al actualizar empresa" }, {
      status: 500,
    });
  }
}

/**
 * DELETE handler para eliminar una empresa por su ID.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    await EmpresaService.deleteEmpresa(params.id);
    return NextResponse.json({ message: "Empresa eliminada exitosamente" }, {
      status: 200,
    });
  } catch (error: any) {
    if (error.message && error.message.includes("sucursales asociadas")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Error al eliminar empresa" }, {
      status: 500,
    });
  }
}
