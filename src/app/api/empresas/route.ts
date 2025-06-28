import { NextRequest, NextResponse } from "next/server";
import { EmpresaService } from "@/services/empresaService";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createEmpresaSchema } from "@/lib/validators/empresaValidator";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    // CORRECCIÓN: Llamamos al servicio sin el booleano, usará el estado ACTIVA por defecto.
    const empresas = await EmpresaService.getEmpresas();
    return NextResponse.json(empresas, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error al obtener empresas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = createEmpresaSchema.parse(body);
    const newEmpresa = await EmpresaService.createEmpresa(validatedData);
    // Devolvemos la empresa anidada para consistencia
    return NextResponse.json({ empresa: newEmpresa }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ message: "Datos de entrada inválidos.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error al crear empresa' }, { status: 500 });
  }
}
