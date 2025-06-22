// RUTA: src/app/actions/empresaActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { empresaSchema, type EmpresaInput } from "@/lib/validators/empresaValidator";

// Definición de tipo para EmpresaConDetalles (EXPORTADO CORRECTAMENTE)
// Incluye todos los detalles de las relaciones que se fetchan
export type EmpresaConDetalles = Awaited<ReturnType<typeof prisma.empresa.findMany>>[number] & {
  direccion?: {
    id: string; 
    calle: string | null; // CAMBIO: Puede ser null en el tipo
    numero: string | null; // CAMBIO: Puede ser null en el tipo
    depto: string | null; // Añadir si existe en el schema y se quiere incluir
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
  } | null; // La dirección completa puede ser null
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
        const validatedData = empresaSchema.parse(values);
        const { nombre, rut, telefono, email, direccion } = validatedData;
    
        // Convertir string vacíos a null para campos opcionales/nulos de Prisma
        const emailToSave = email === '' ? null : email;
        const telefonoToSave = telefono === '' ? null : telefono;

        // Comprobar si hay datos de dirección válidos para crearla
        // Un campo de dirección se considera válido si al menos 'calle', 'numero' o 'comunaId' tienen un valor.
        const hasDireccionData = direccion && (
            (direccion.calle !== undefined && direccion.calle !== '') || 
            (direccion.numero !== undefined && direccion.numero !== '') || 
            (direccion.comunaId !== null && direccion.comunaId !== undefined && direccion.comunaId !== '')
        );

        let newEmpresa;

        if (hasDireccionData) {
            // Si hay datos de dirección, crear la Dirección y conectar a la Empresa
            newEmpresa = await prisma.empresa.create({
                data: {
                    nombre,
                    rut,
                    telefono: telefonoToSave,
                    email: emailToSave,
                    direccion: {
                        create: {
                            calle: direccion.calle === '' ? null : direccion.calle, // Guardar '' como null
                            numero: direccion.numero === '' ? null : direccion.numero, // Guardar '' como null
                            comunaId: direccion.comunaId || '', // Si es null/undefined/vacío, usar '' para Prisma. (comunaId en schema es String, no String?)
                        }
                    }
                },
            });
        } else {
            // Crear la Empresa sin Dirección
            newEmpresa = await prisma.empresa.create({
                data: {
                    nombre,
                    rut,
                    telefono: telefonoToSave,
                    email: emailToSave,
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
        const validatedData = empresaSchema.parse(values);
        const { nombre, rut, telefono, email, direccion } = validatedData;

        // Convertir string vacíos a null para campos opcionales/nulos de Prisma
        const emailToSave = email === '' ? null : email;
        const telefonoToSave = telefono === '' ? null : telefono;

        // Comprobar si hay datos de dirección válidos en el formulario
        const hasDireccionDataInForm = direccion && (
            (direccion.calle !== undefined && direccion.calle !== '') || 
            (direccion.numero !== undefined && direccion.numero !== '') || 
            (direccion.comunaId !== null && direccion.comunaId !== undefined && direccion.comunaId !== '')
        );

        // Obtener la empresa con su dirección actual para saber si ya tiene una
        const existingEmpresaWithAddress = await prisma.empresa.findUnique({
            where: { id },
            select: { id: true, direccion: { select: { id: true } } } // Solo necesitamos el ID de la dirección si existe
        });

        const currentDireccionId = existingEmpresaWithAddress?.direccion?.id;

        // Lógica de actualización de la dirección
        if (hasDireccionDataInForm) {
            // Hay datos de dirección en el formulario
            const direccionDataForDb = {
                calle: direccion.calle === '' ? null : direccion.calle,
                numero: direccion.numero === '' ? null : direccion.numero,
                comunaId: direccion.comunaId || '', // ComunaId no puede ser null en create/update de Direccion
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
                            connect: { id: id } // Conectar la nueva dirección a esta empresa
                        }
                    }
                });
            }
        } else if (currentDireccionId) {
            // NO hay datos de dirección en el formulario, pero la empresa SÍ tenía una dirección.
            // Esto significa que el usuario la "borró" del formulario, así que la eliminamos de la DB.
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
            // La relación de dirección ya se manejó explícitamente arriba, no se incluye aquí
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
        // Antes de eliminar la empresa, eliminamos explícitamente su dirección asociada si existe
        // Esto es necesario para relaciones 1:1 donde 'Direccion' tiene 'empresaId @unique' y 'onDelete: Cascade' desde Direccion
        // Si Direccion tiene 'onDelete: Cascade' en su relation 'empresa', al eliminar la empresa, también se elimina la dirección
        // PERO para mayor seguridad y evitar problemas, podemos intentar eliminarla explícitamente primero.
        // Ojo: Si el schema ya tiene CASCADE en Direccion, esto podría ser redundante.
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
