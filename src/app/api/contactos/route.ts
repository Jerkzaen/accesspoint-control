// RUTA: src/app/api/contactos/route.ts
// (Este es el archivo para la ruta principal, NO la de [id])

import { ContactoEmpresaService, ContactoEmpresaCreateInput } from "@/services/contactoEmpresaService";
import { Prisma } from "@prisma/client";
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";

/**
 * GET handler para obtener TODOS los contactos.
 * No recibe `params`.
 */
export async function GET(request: Request): Promise<NextResponse> {
  // Verificación de sesión
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const contactos = await ContactoEmpresaService.getContactosEmpresa(true);
    // No es necesario serializar las fechas aquí, NextResponse lo maneja bien.
    return NextResponse.json(contactos, { status: 200 });
  } catch (error: any) {
    console.error('Error en GET /api/contactos:', error);
    return NextResponse.json({ message: 'Error al obtener contactos' }, { status: 500 });
  }
}

/**
 * POST handler para CREAR un nuevo contacto.
 * No recibe `params`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Verificación de sesión
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const data: ContactoEmpresaCreateInput = await request.json();
    const newContacto = await ContactoEmpresaService.createContactoEmpresa(data);
    return NextResponse.json(newContacto, { status: 201 });
  } catch (error: any) {
    console.error('Error en POST /api/contactos:', error);
    // Manejo de error de email duplicado
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'Error al crear contacto: El correo electrónico ya existe.' }, { status: 409 });
    }
    // Manejo de otros errores
    return NextResponse.json({ message: 'Error al crear contacto' }, { status: 500 });
  }
}
