// src/app/api/contactos/[id]/route.ts

import { ContactoEmpresaService, ContactoEmpresaUpdateInput } from "@/services/contactoEmpresaService";
import { Prisma } from "@prisma/client";
import { NextResponse } from 'next/server';

/**
 * GET handler para obtener un contacto de empresa por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del contacto.
 * @returns Una respuesta JSON con el contacto o un mensaje de error.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const contacto = await ContactoEmpresaService.getContactoEmpresaById(params.id);
    if (!contacto) {
      return NextResponse.json({ message: "Contacto no encontrado" }, { status: 404 });
    }
    // Serializar fechas igual que en la ruta principal
    const contactoJson = {
      ...contacto,
      createdAt: contacto.createdAt?.toISOString?.() ?? contacto.createdAt,
      updatedAt: contacto.updatedAt?.toISOString?.() ?? contacto.updatedAt,
      empresa: contacto.empresa
        ? {
            ...contacto.empresa,
            createdAt: contacto.empresa.createdAt?.toISOString?.() ?? contacto.empresa.createdAt,
            updatedAt: contacto.empresa.updatedAt?.toISOString?.() ?? contacto.empresa.updatedAt,
          }
        : null,
      ubicacion: contacto.ubicacion
        ? {
            ...contacto.ubicacion,
            createdAt: contacto.ubicacion.createdAt?.toISOString?.() ?? contacto.ubicacion.createdAt,
            updatedAt: contacto.ubicacion.updatedAt?.toISOString?.() ?? contacto.ubicacion.updatedAt,
          }
        : null,
    };
    return NextResponse.json(contactoJson, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error al obtener contacto" }, { status: 500 });
  }
}

/**
 * PUT handler para actualizar un contacto de empresa por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del contacto.
 * @returns Una respuesta JSON con el contacto actualizado o un mensaje de error.
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const data: ContactoEmpresaUpdateInput = await request.json();
    const updatedContacto = await ContactoEmpresaService.updateContactoEmpresa({ ...data, id: params.id });
    return NextResponse.json(updatedContacto, { status: 200 });
  } catch (error: any) {

    if (error.message && error.message.startsWith('Error de validación')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {

      if (error.code === 'P2002') {
        return NextResponse.json({ message: 'Error al actualizar contacto: El correo electrónico ya existe.' }, { status: 409 });
      }
    }
    return NextResponse.json({ message: 'Error al actualizar contacto' }, { status: 500 });
  }

}

/**
 * DELETE handler para eliminar un contacto de empresa por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del contacto.
 * @returns Una respuesta JSON de éxito o un mensaje de error.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await ContactoEmpresaService.deleteContactoEmpresa(params.id);
    return NextResponse.json({ message: 'Contacto de empresa eliminado exitosamente' }, { status: 200 });
  } catch (error: any) {
    const msg = error.message || '';
    if (
      /pr[eé]stados asociados/i.test(msg) ||
      /pr[eé]stamos asociados/i.test(msg) ||
      /tickets asociados/i.test(msg)
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error al eliminar contacto' }, { status: 500 });
  }
}
