// src/app/api/contactos/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ContactoEmpresaService, ContactoEmpresaCreateInput } from "@/services/contactoEmpresaService";
import { Prisma } from "@prisma/client";

/**
 * GET handler para obtener todos los contactos de empresa.
 * @param request La solicitud Next.js.
 * @returns Una respuesta JSON con los contactos o un mensaje de error.
 */
export async function GET(request: NextRequest) {
  try {
    // Incluimos relaciones por defecto para la visualización general si es útil.
    // Esto podría ajustarse según la necesidad específica del frontend.
    const contactos = await ContactoEmpresaService.getContactosEmpresa(true); 
    return NextResponse.json(contactos);
  } catch (error) {
    console.error("Error en GET /api/contactos:", error);
    return NextResponse.json(
      { message: "Error al obtener contactos", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * POST handler para crear un nuevo contacto de empresa.
 * @param request La solicitud Next.js.
 * @returns Una respuesta JSON con el contacto creado o un mensaje de error.
 */
export async function POST(request: NextRequest) {
  try {
    const data: ContactoEmpresaCreateInput = await request.json();
    const newContacto = await ContactoEmpresaService.createContactoEmpresa(data);
    return NextResponse.json(newContacto, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/contactos:", error);
    if (error instanceof Error && 'issues' in error) { // ZodError
      return NextResponse.json(
        { message: "Error de validación al crear contacto: " + (error as any).issues.map((i: any) => i.message).join(", ") },
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { // Unique constraint failed (e.g., on email)
        return NextResponse.json(
          { message: "Error al crear contacto: El correo electrónico ya existe.", error: error.message },
          { status: 409 } // Conflict
        );
      }
    }
    return NextResponse.json(
      { message: "Error al crear contacto", error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
