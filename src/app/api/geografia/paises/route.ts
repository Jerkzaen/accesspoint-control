// RUTA: src/app/api/geografia/paises/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GeografiaService } from "@/services/geografiaService";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  const paises = await GeografiaService.getPaises();
  return NextResponse.json(paises);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ message: "Acceso prohibido" }, { status: 403 });
  const data = await request.json();
  const nuevoPais = await GeografiaService.createPais(data);
  return NextResponse.json(nuevoPais, { status: 201 });
}
