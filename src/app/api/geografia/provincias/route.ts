// RUTA: src/app/api/geografia/provincias/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GeografiaService } from "@/services/geografiaService";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    const provincias = await GeografiaService.getProvincias();
    return NextResponse.json(provincias);
}
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ message: "Acceso prohibido" }, { status: 403 });
    const data = await req.json();
    const nuevaProvincia = await GeografiaService.createProvincia(data);
    return NextResponse.json(nuevaProvincia, { status: 201 });
}
