import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GeografiaService } from "@/services/geografiaService";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  // CORRECCIÓN: Cualquier usuario autenticado puede buscar.
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('search');

  // Si no hay término de búsqueda, devolvemos un error 400.
  if (!searchTerm) {
    return NextResponse.json({ message: "El parámetro 'search' es requerido." }, { status: 400 });
  }

  // Si hay término de búsqueda, lo usamos.
  try {
    const comunas = await GeografiaService.searchComunas(searchTerm);
    return NextResponse.json(comunas, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error al buscar comunas" },
      { status: 500 }
    );
  }
}

