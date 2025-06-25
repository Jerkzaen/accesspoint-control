// RUTA: src/app/api/empresas/route.ts

import { NextResponse } from "next/server";
import { EmpresaService } from "@/services/empresaService";
import { Prisma } from "@prisma/client";
// 1. --- IMPORTAMOS getServerSession ---
import { getServerSession } from "next-auth/next";

/**
 * GET handler para obtener todas las empresas.
 * @returns Una respuesta JSON con las empresas o un mensaje de error.
 */
export async function GET(request: Request) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const empresas = await EmpresaService.getEmpresas(true);
    return NextResponse.json(empresas, { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/empresas:", error);
    return NextResponse.json(
      { message: "Error al obtener empresas", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * POST handler para crear una nueva empresa.
 * @param request La solicitud Next.js.
 * @returns Una respuesta JSON con la empresa creada o un mensaje de error.
 */
export async function POST(request: Request) {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const newEmpresa = await EmpresaService.createEmpresa(body);
    return NextResponse.json(newEmpresa, { status: 201 });
  } catch (error: any) {
    if (error.message && error.message.startsWith('Error de validación')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'Error al crear empresa: El RUT ya existe.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error al crear empresa' }, { status: 500 });
  }
}
