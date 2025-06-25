// src/app/api/empresas/route.ts

import { NextResponse } from "next/server";
import { EmpresaService } from "@/services/empresaService"; // Importar el nuevo servicio
import { Prisma } from "@prisma/client"; // Para tipos de errores de Prisma si es necesario

/**
 * GET handler para obtener todas las empresas.
 * @returns Una respuesta JSON con las empresas o un mensaje de error.
 */
export async function GET() {
  try {
    const empresas = await EmpresaService.getEmpresas(true); // Incluimos la dirección principal
    const empresasJson = JSON.parse(JSON.stringify(empresas)); // Serializar fechas a string para que coincida con los tests
    return new Response(JSON.stringify(empresasJson), { status: 200 });
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
  try {
    const body = await request.json();
    const newEmpresa = await EmpresaService.createEmpresa(body);
    return new Response(JSON.stringify(newEmpresa), { status: 201 });
  } catch (error: any) {
    if (error.message && error.message.startsWith('Error de validación')) {
      return new Response(JSON.stringify({ message: error.message }), { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new Response(JSON.stringify({ message: 'Error al crear empresa: El RUT ya existe.' }), { status: 409 });
    }
    return new Response(JSON.stringify({ message: 'Error al crear empresa' }), { status: 500 });
  }
}

// Ruta para actualizar y eliminar una empresa específica
// src/app/api/empresas/[id]/route.ts (esto sería un nuevo archivo)
// Para el GET/PUT/DELETE de una sola empresa, se crearía un nuevo archivo
// en src/app/api/empresas/[id]/route.ts
// Ejemplo de cómo sería un GET para [id] (no lo estoy creando aquí, solo un ejemplo):
/*
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const empresa = await EmpresaService.getEmpresaById(params.id);
    if (!empresa) {
      return NextResponse.json({ message: "Empresa no encontrada" }, { status: 404 });
    }
    return NextResponse.json(empresa);
  } catch (error) {
    console.error(`Error en GET /api/empresas/${params.id}:`, error);
    return NextResponse.json({ message: "Error al obtener empresa" }, { status: 500 });
  }
}
*/
