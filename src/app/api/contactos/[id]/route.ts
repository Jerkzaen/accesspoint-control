// RUTA: src/app/api/contactos/[id]/route.ts

import { ContactoEmpresaService, ContactoEmpresaUpdateInput } from "@/services/contactoEmpresaService";
import { Prisma } from "@prisma/client";
import { NextResponse } from 'next/server';
// 1. --- IMPORTAMOS getServerSession ---
import { getServerSession } from "next-auth/next";

/**
 * GET handler para obtener un contacto por su ID.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const contacto = await ContactoEmpresaService.getContactoEmpresaById(params.id);
    if (!contacto) {
      return NextResponse.json({ message: "Contacto no encontrado" }, { status: 404 });
    }
    return NextResponse.json(contacto, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error al obtener contacto" }, { status: 500 });
  }
}

/**
 * PUT handler para actualizar un contacto por su ID.
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const data: ContactoEmpresaUpdateInput = await request.json();
    const updatedContacto = await ContactoEmpresaService.updateContactoEmpresa({ ...data, id: params.id });
    return NextResponse.json(updatedContacto, { status: 200 });
  } catch (error: any) {
    if (error.message && error.message.startsWith('Error de validación')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'Error al actualizar contacto: El correo electrónico ya existe.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error al actualizar contacto' }, { status: 500 });
  }
}

/**
 * DELETE handler para eliminar un contacto por su ID.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // 2. --- AÑADIMOS LA VERIFICACIÓN DE SESIÓN ---
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  
  try {
    await ContactoEmpresaService.deleteContactoEmpresa(params.id);
    return NextResponse.json({ message: 'Contacto de empresa eliminado exitosamente' }, { status: 200 });
  } catch (error: any) {
    const msg = error.message || '';
    if (
      /pr[eé]stados asociados/i.test(msg) ||
      /tickets asociados/i.test(msg)
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error al eliminar contacto' }, { status: 500 });
  }
}
