"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
// CORRECCIÓN: Se importa el validador correcto desde tu archivo original.
import { empresaSchema } from "@/lib/validators/empresaValidator";

// Función para obtener todas las empresas con sus detalles para la nueva interfaz
export async function getEmpresasConDetalles() {
  try {
    const empresas = await prisma.empresa.findMany({
      include: {
        direccion: {
          include: {
            comuna: true,
          },
        },
        _count: {
          select: { sucursales: true },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });
    return { success: true, data: empresas };
  } catch (error) {
    console.error('Error al obtener las empresas con detalles:', error);
    return { success: false, error: 'No se pudieron obtener las empresas.' };
  }
}

// CORRECCIÓN: Lógica de creación refactorizada para el nuevo schema
export async function createEmpresa(values: z.infer<typeof empresaSchema>) {
    try {
        const validatedData = empresaSchema.parse(values);
        const { nombre, rut, telefono, email, direccion } = validatedData;
    
        const newEmpresa = await prisma.empresa.create({
            data: {
                nombre,
                rut,
                telefono,
                email,
                // Prisma ahora puede crear la dirección de forma anidada gracias al nuevo schema
                direccion: (direccion && direccion.calle && direccion.numero && direccion.comunaId) ? {
                  create: {
                    calle: direccion.calle,
                    numero: direccion.numero,
                    comunaId: direccion.comunaId,
                  }
                } : undefined,
            },
        });
        
        revalidatePath('/admin/empresas');
        return { success: true, data: newEmpresa, message: "Empresa creada con éxito." };
      } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
            return { success: false, error: "Datos de formulario no válidos." };
        }
        return { success: false, error: "Error al crear la empresa." };
      }
}

// CORRECCIÓN: Lógica de actualización refactorizada
export async function updateEmpresa(id: string, values: z.infer<typeof empresaSchema>) {
    try {
        const validatedData = empresaSchema.parse(values);
        const { nombre, rut, telefono, email, direccion } = validatedData;
    
        const updatedEmpresa = await prisma.empresa.update({
          where: { id },
          data: {
            nombre,
            rut,
            telefono,
            email,
            direccion: (direccion && direccion.calle && direccion.numero && direccion.comunaId) ? {
              // 'upsert' maneja la creación o actualización de la dirección de forma segura
              upsert: {
                create: {
                  calle: direccion.calle,
                  numero: direccion.numero,
                  comunaId: direccion.comunaId,
                },
                update: {
                  calle: direccion.calle,
                  numero: direccion.numero,
                  comunaId: direccion.comunaId,
                }
              }
            } : undefined,
          },
        });
        
        revalidatePath('/admin/empresas');
        return { success: true, data: updatedEmpresa, message: "Empresa actualizada con éxito." };
      } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
            return { success: false, error: "Datos de formulario no válidos." };
        }
        return { success: false, error: "Error al actualizar la empresa." };
      }
}

export async function deleteEmpresa(id: string) {
    try {
        // Con 'onDelete: Cascade' en el schema, al borrar la empresa,
        // Prisma borrará automáticamente la dirección asociada.
        await prisma.empresa.delete({ where: { id } });
        
        revalidatePath('/admin/empresas');
        return { success: true, message: "Empresa eliminada." };
      } catch (error) {
        console.error(error);
        return { success: false, error: "Error al eliminar la empresa." };
      }
}