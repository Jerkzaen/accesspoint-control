// RUTA: src/app/actions/empresaActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { empresaSchema, type EmpresaInput } from "@/lib/validators/empresaValidator";

// Definición de tipo para EmpresaConDetalles (EXPORTADO CORRECTAMENTE)
// Incluye todos los detalles de las relaciones que se fetchan, y ahora logoUrl
export type EmpresaConDetalles = Awaited<ReturnType<typeof prisma.empresa.findMany>>[number] & {
  logoUrl: string | null; 
  direccion?: { // Direccion sigue siendo opcional para Empresa
    id: string; 
    calle: string; // CAMBIO: Ahora string, ya no string | null
    numero: string; // CAMBIO: Ahora string, ya no string | null
    depto: string | null; 
    comuna: {
      id: string;
      nombre: string;
      provincia: {
        id: string;
        nombre: string;
        region: {
          id: string;
          nombre: string;
        };
      };
    };
  } | null; 
  _count: {
    sucursales: number;
  };
};

// Función para obtener todas las empresas con sus detalles completos
export async function getEmpresasConDetalles() {
  try {
    const empresas = await prisma.empresa.findMany({
      include: {
        direccion: {
          include: {
            comuna: { 
              include: {
                provincia: {
                  include: {
                    region: true
                  }
                }
              }
            },
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
    return { success: true, data: empresas as EmpresaConDetalles[] };
  } catch (error: any) {
    console.error('Error al obtener las empresas con detalles:', error);
    return { success: false, message: error.message || 'No se pudieron obtener las empresas.' }; 
  }
}

// Lógica de creación de empresa
export async function createEmpresa(values: EmpresaInput) {
    try {
        const validatedData = empresaSchema.parse(values); // Zod ya valida que si 'direccion' existe, sus campos son 'string'
        const { nombre, rut, telefono, email, logoUrl, direccion } = validatedData;

        const emailToSave = email === '' ? null : email;
        const telefonoToSave = telefono === '' ? null : telefono;
        const logoUrlToSave = logoUrl === '' ? null : logoUrl;

        // Si el objeto 'direccion' está presente en los datos validados, lo usamos.
        // Si no está presente (undefined), Prisma creará la Empresa sin Direccion.
        let newEmpresa;

        if (direccion) { // Si direccion NO es undefined (porque Zod la validó como objeto válido)
            newEmpresa = await prisma.empresa.create({
                data: {
                    nombre,
                    rut,
                    telefono: telefonoToSave,
                    email: emailToSave,
                    logoUrl: logoUrlToSave,
                    direccion: {
                        create: {
                            calle: direccion.calle, // Garantizado como String por Zod
                            numero: direccion.numero, // Garantizado como String por Zod
                            comunaId: direccion.comunaId, // Garantizado como String por Zod
                        }
                    }
                },
            });
        } else {
            // Si el objeto 'direccion' no fue proporcionado o no pasó la validación de Zod como objeto completo
            newEmpresa = await prisma.empresa.create({
                data: {
                    nombre,
                    rut,
                    telefono: telefonoToSave,
                    email: emailToSave,
                    logoUrl: logoUrlToSave,
                },
            });
        }
        
        revalidatePath('/admin/empresas');
        return { success: true, data: newEmpresa, message: "Empresa creada con éxito." };
      } catch (error: any) {
        console.error("Error creating empresa:", error);
        if (error instanceof z.ZodError) {
            return { success: false, message: "Datos de formulario no válidos.", issues: error.errors };
        }
        if (error.code === 'P2002' && error.meta?.target?.includes('rut')) {
          return { success: false, message: "El RUT ya existe para otra empresa." };
        }
        return { success: false, message: error.message || "Error al crear la empresa." };
      }
}

// Lógica de actualización de empresa
export async function updateEmpresa(id: string, values: EmpresaInput) {
    try {
        const validatedData = empresaSchema.parse(values); // Zod ya valida
        const { nombre, rut, telefono, email, logoUrl, direccion } = validatedData;

        const emailToSave = email === '' ? null : email;
        const telefonoToSave = telefono === '' ? null : telefono;
        const logoUrlToSave = logoUrl === '' ? null : logoUrl;

        // Si el objeto 'direccion' está presente en los datos validados, lo usamos.
        const hasDireccionObjectInForm = direccion !== undefined; 

        // Obtener la empresa con su dirección actual para saber si ya tiene una
        const existingEmpresaWithAddress = await prisma.empresa.findUnique({
            where: { id },
            select: { id: true, direccion: { select: { id: true } } } 
        });

        const currentDireccionId = existingEmpresaWithAddress?.direccion?.id;

        // Lógica de actualización de la dirección
        if (hasDireccionObjectInForm) {
            // Si el objeto 'direccion' está presente (y válido por Zod)
            const direccionDataForDb = {
                calle: direccion.calle, // Garantizado como String por Zod
                numero: direccion.numero, // Garantizado como String por Zod
                comunaId: direccion.comunaId, // Garantizado como String por Zod
            };

            if (currentDireccionId) {
                // Si la empresa ya tenía una dirección, actualizarla
                await prisma.direccion.update({
                    where: { id: currentDireccionId },
                    data: direccionDataForDb,
                });
            } else {
                // Si la empresa no tenía dirección, crear una nueva y conectarla
                await prisma.direccion.create({
                    data: {
                        ...direccionDataForDb,
                        empresa: {
                            connect: { id: id } 
                        }
                    }
                });
            }
        } else if (currentDireccionId) {
            // Si el objeto 'direccion' NO está presente en el formulario (se borró)
            // Y la empresa SÍ tenía una dirección, la eliminamos de la DB.
            await prisma.direccion.delete({
                where: { id: currentDireccionId },
            });
        }
        
        // Actualizar la información básica de la Empresa
        const updatedEmpresa = await prisma.empresa.update({
          where: { id },
          data: {
            nombre,
            rut,
            telefono: telefonoToSave,
            email: emailToSave,
            logoUrl: logoUrlToSave,
          },
        });
        
        revalidatePath('/admin/empresas');
        return { success: true, data: updatedEmpresa, message: "Empresa actualizada con éxito." };
      } catch (error: any) {
        console.error("Error updating empresa:", error);
        if (error instanceof z.ZodError) {
            return { success: false, message: "Datos de formulario no válidos.", issues: error.errors };
        }
        if (error.code === 'P2002' && error.meta?.target?.includes('rut')) {
          return { success: false, message: "El RUT ya existe para otra empresa." };
        }
        return { success: false, message: error.message || "Error al actualizar la empresa." };
      }
}

// Lógica de eliminación de empresa
export async function deleteEmpresa(id: string) {
    try {
        const empresaToDelete = await prisma.empresa.findUnique({
            where: { id },
            select: { direccion: { select: { id: true } } }
        });
        if (empresaToDelete?.direccion?.id) {
            await prisma.direccion.delete({
                where: { id: empresaToDelete.direccion.id }
            });
        }

        await prisma.empresa.delete({ where: { id } });
        
        revalidatePath('/admin/empresas');
        return { success: true, message: "Empresa eliminada." };
      } catch (error: any) {
        console.error("Error deleting empresa:", error);
        if (error.code === 'P2003') { 
          return { success: false, message: "No se puede eliminar la empresa porque tiene sucursales o contactos asociados. Elimine estos primero." };
        }
        return { success: false, message: error.message || "Error al eliminar la empresa." };
      }
}
