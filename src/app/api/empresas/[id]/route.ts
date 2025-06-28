import { NextRequest, NextResponse } from "next/server";
import { EmpresaService } from "@/services/empresaService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { updateEmpresaSchema } from "@/lib/validators/empresaValidator";

// GET y PUT están bien, no se tocan.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    
    const empresa = await EmpresaService.getEmpresaById(params.id);
    if(!empresa) return NextResponse.json({ message: 'Empresa no encontrada' }, { status: 404 });
    
    return NextResponse.json(empresa);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    try {
        const data = await req.json();
        const validatedData = updateEmpresaSchema.parse(data);
        const empresaActualizada = await EmpresaService.updateEmpresa(params.id, validatedData);
        return NextResponse.json(empresaActualizada);
    } catch (error) {
        return NextResponse.json({ message: 'Error al actualizar la empresa' }, { status: 500 });
    }
}

// --- CORRECCIÓN CLAVE ---
// El handler DELETE ahora llama al método correcto: 'deactivateEmpresa'.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    try {
        await EmpresaService.deactivateEmpresa(params.id);
        return NextResponse.json({ message: 'Empresa desactivada exitosamente' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Error al desactivar la empresa' }, { status: 500 });
    }
}
