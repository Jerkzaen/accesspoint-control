import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ContactoEmpresaService } from '@/services/contactoEmpresaService';
import { updateContactoEmpresaSchema } from '@/lib/validators/contactoEmpresaValidator';

// GET y PUT están bien, no se tocan.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const contacto = await ContactoEmpresaService.getContactoEmpresaById(params.id);
    if (!contacto) return NextResponse.json({ message: 'Contacto no encontrado' }, { status: 404 });

    return NextResponse.json(contacto);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    try {
        const data = await req.json();
        const validatedData = updateContactoEmpresaSchema.parse({ id: params.id, ...data });
        const contactoActualizado = await ContactoEmpresaService.updateContactoEmpresa(validatedData);
        return NextResponse.json(contactoActualizado);
    } catch (error) {
        return NextResponse.json({ message: 'Error al actualizar el contacto.' }, { status: 500 });
    }
}


// --- CORRECCIÓN CLAVE Y DEFINITIVA ---
// El handler DELETE ahora llama al método correcto 'deactivateContactoEmpresa'.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    try {
        // Llamamos al método correcto que SÍ existe en el servicio
        await ContactoEmpresaService.deactivateContactoEmpresa(params.id);
        // Devolvemos la respuesta de éxito con código 200
        return NextResponse.json({ message: 'Contacto desactivado exitosamente' }, { status: 200 });
    } catch (error) {
        // Si algo falla, devolvemos 500
        return NextResponse.json({ message: 'Error al desactivar el contacto.' }, { status: 500 });
    }
}
