// RUTA: src/app/api/geografia/provincias/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GeografiaService } from "@/services/geografiaService";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const provincia = await GeografiaService.getProvinciaById(params.id);
    if (!provincia) return NextResponse.json({ message: 'Provincia no encontrada' }, { status: 404 });

    return NextResponse.json(provincia);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ message: "Acceso prohibido" }, { status: 403 });

    const data = await req.json();
    const provinciaActualizada = await GeografiaService.updateProvincia(params.id, data);

    return NextResponse.json(provinciaActualizada);
}