import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ContactoEmpresaService } from '@/services/contactoEmpresaService';
import { createContactoEmpresaSchema } from '@/lib/validators/contactoEmpresaValidator';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    
    const contactos = await ContactoEmpresaService.getContactosEmpresa();
    return NextResponse.json(contactos);
}

// Handler POST para crear un nuevo contacto
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    try {
        const data = await req.json();
        const validatedData = createContactoEmpresaSchema.parse(data);
        const nuevoContacto = await ContactoEmpresaService.createContactoEmpresa(validatedData);
        
        return NextResponse.json({ contacto: nuevoContacto }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ message: 'Error al crear el contacto.' }, { status: 500 });
    }
}
