import { NextRequest as NR1, NextResponse as NRsp1 } from "next/server";
import { getServerSession as gss1 } from "next-auth/next";
import { authOptions as ao1 } from "@/lib/auth";
import { GeografiaService as GS1 } from "@/services/geografiaService";

export async function GET(req: NR1, { params }: { params: { id: string } }) {
    const session = await gss1(ao1);
    if (!session) return NRsp1.json({ message: 'No autorizado' }, { status: 401 });
    const pais = await GS1.getPaisById(params.id);
    if (!pais) return NRsp1.json({ message: 'País no encontrado' }, { status: 404 });
    return NRsp1.json(pais);
}

export async function PUT(req: NR1, { params }: { params: { id: string } }) {
    const session = await gss1(ao1);
    if (session?.user?.role !== 'ADMIN') return NRsp1.json({ message: "Acceso prohibido" }, { status: 403 });
    const data = await req.json();
    const paisActualizado = await GS1.updatePais(params.id, data);
    return NRsp1.json(paisActualizado);
}