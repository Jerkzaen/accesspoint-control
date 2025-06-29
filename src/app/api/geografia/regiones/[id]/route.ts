// RUTA: src/app/api/geografia/regiones/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GeografiaService } from "@/services/geografiaService";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    
    const region = await GeografiaService.getRegionById(params.id);
    if (!region) return NextResponse.json({ message: 'Región no encontrada' }, { status: 404 });
    
    return NextResponse.json(region);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ message: "Acceso prohibido" }, { status: 403 });
    
    const data = await req.json();
    const regionActualizada = await GeografiaService.updateRegion(params.id, data);
    
    return NextResponse.json(regionActualizada);
}