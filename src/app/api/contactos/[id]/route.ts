    // src/app/api/contactos/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ContactoEmpresaService, ContactoEmpresaUpdateInput } from "@/services/contactoEmpresaService";
import { Prisma } from "@prisma/client";

/**
 * GET handler para obtener un contacto de empresa por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del contacto.
 * @returns Una respuesta JSON con el contacto o un mensaje de error.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const contacto = await ContactoEmpresaService.getContactoEmpresaById(id);
    if (!contacto) {
      return NextResponse.json({ message: "Contacto no encontrado" }, { status: 404 });
    }
    return NextResponse.json(contacto);
  } catch (error) {
    console.error(`Error en GET /api/contactos/${params.id}:`, error);
    return NextResponse.json(
      { message: "Error al obtener contacto", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler para actualizar un contacto de empresa por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del contacto.
 * @returns Una respuesta JSON con el contacto actualizado o un mensaje de error.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data: ContactoEmpresaUpdateInput = await request.json();
    // Aseguramos que el ID de la ruta sobreescriba cualquier ID en el cuerpo.
    const updatedContacto = await ContactoEmpresaService.updateContactoEmpresa({ ...data, id }); 
    return NextResponse.json(updatedContacto);
  } catch (error) {
    console.error(`Error en PUT /api/contactos/${params.id}:`, error);
    if (error instanceof Error && 'issues' in error) { // ZodError
      return NextResponse.json(
        { message: "Error de validación al actualizar contacto: " + (error as any).issues.map((i: any) => i.message).join(", ") },
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { // Unique constraint failed (e.g., on email)
        return NextResponse.json(
          { message: "Error al actualizar contacto: El correo electrónico ya existe.", error: error.message },
          { status: 409 } // Conflict
        );
      }
    }
    return NextResponse.json(
      { message: "Error al actualizar contacto", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler para eliminar un contacto de empresa por su ID.
 * @param request La solicitud Next.js.
 * @param params Los parámetros de la ruta, incluyendo el ID del contacto.
 * @returns Una respuesta JSON de éxito o un mensaje de error.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await ContactoEmpresaService.deleteContactoEmpresa(id);
    if (!result.success) {
      return NextResponse.json({ message: result.message || "Error al eliminar contacto" }, { status: 400 });
    }
    return NextResponse.json({ message: result.message || "Contacto eliminado exitosamente" }, { status: 200 });
  } catch (error) {
    console.error(`Error en DELETE /api/contactos/${params.id}:`, error);
    return NextResponse.json(
      { message: "Error al eliminar contacto", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
