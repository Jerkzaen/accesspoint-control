"use server";
import { prisma } from "@/lib/prisma";

import { Sucursal, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type SucursalInput = {
  nombre: string;
  telefono: string;
  email: string;
  direccionCalle: string;
  direccionNumero: string;
  direccionComunaId: string;
  empresaId: string;
};

// --- NUEVO TIPO DE ENTRADA PARA EL FORMULARIO EN LÍNEA ---
export type CreateSucursalFromFormData = {
  nombre: string;
  calle: string;
  numero: string;
  comunaId: string;
  empresaId: string; // La empresa a la que pertenece
};

// --- NUEVA SERVER ACTION ---
export async function createSucursalFromForm(data: CreateSucursalFromFormData) {
  try {
    // Usamos una transacción para asegurar que todo se cree correctamente.
    const newSucursal = await prisma.$transaction(async (tx) => {
      // 1. Crear la dirección
      const newDireccion = await tx.direccion.create({
        data: {
          calle: data.calle,
          numero: data.numero,
          comunaId: data.comunaId,
        },
      });

      // 2. Crear la sucursal, vinculándola a la dirección y empresa
      const createdSucursal = await tx.sucursal.create({
        data: {
          nombre: data.nombre,
          empresaId: data.empresaId,
          direccionId: newDireccion.id,
        },
        include: {
            empresa: true,
            direccion: {
                include: {
                    comuna: true
                }
            }
        }
      });

      return createdSucursal;
    });

    revalidatePath("/admin/sucursales"); // Revalidar por si acaso
    return { success: true, data: newSucursal };
  } catch (error) {
    console.error("Error al crear sucursal desde formulario:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: "Ya existe una sucursal con datos similares." };
      }
    }
    return { success: false, error: "No se pudo crear la sucursal." };
  }
}

export async function getSucursales(): Promise<Prisma.SucursalGetPayload<{
  include: {
    empresa: true;
    direccion: {
      include: {
        comuna: {
          include: {
            provincia: {
              include: {
                region: {
                  include: {
                    pais: true;
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}>[]> {
  try {
    const sucursales = await prisma.sucursal.findMany({
      include: {
        empresa: true,
        direccion: {
          include: {
            comuna: {
              include: {
                provincia: {
                  include: {
                    region: {
                      include: {
                        pais: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        nombre: "asc",
      },
    });
    return sucursales;
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    return [];
  }
}

export async function addSucursal(data: SucursalInput) {
  try {
    const newSucursal = await prisma.sucursal.create({
      data: {
        nombre: data.nombre,
        telefono: data.telefono,
        email: data.email,
        direccion: {
          create: {
            calle: data.direccionCalle,
            numero: data.direccionNumero,
            comuna: { connect: { id: data.direccionComunaId } },
          },
        },
        empresa: { connect: { id: data.empresaId } },
      },
    });

    revalidatePath("/admin/sucursales");
    return { success: true, data: newSucursal };
  } catch (error) {
    console.error("Error al añadir sucursal:", error);
    return { success: false, error: "Error al añadir sucursal." };
  }
}

export async function updateSucursal(id: string, data: Partial<SucursalInput>) {
  try {


    const updatedSucursal = await prisma.sucursal.update({
      where: { id },
      data: {
        nombre: data.nombre,
        telefono: data.telefono,
        email: data.email,
        direccion: {
          update: {
            calle: data.direccionCalle,
            numero: data.direccionNumero,
            comuna: data.direccionComunaId ? { connect: { id: data.direccionComunaId } } : undefined,
          },
        },
        empresa: data.empresaId ? { connect: { id: data.empresaId } } : undefined,
      },
    });


    revalidatePath("/admin/sucursales");
    return { success: true, data: updatedSucursal };
  } catch (error) {
    console.error("Error al actualizar sucursal:", error);
    return { success: false, error: "Error al actualizar sucursal." };
  }
}

export async function deleteSucursal(id: string) {
  try {
    const sucursalToDelete = await prisma.sucursal.findUnique({
      where: { id },
      select: { direccionId: true, empresaId: true },
    });

    if (!sucursalToDelete || !sucursalToDelete.direccionId) {
      return { success: false, error: "Sucursal o dirección asociada no encontrada." };
    }

    if (sucursalToDelete.empresaId) {
      await prisma.empresa.update({
        where: { id: sucursalToDelete.empresaId },
        data: {
          sucursales: {
            disconnect: { id: id },
          },
        },
      });
    }

    await prisma.sucursal.delete({
      where: { id },
    });

    await prisma.direccion.delete({
      where: { id: sucursalToDelete.direccionId },
    });

    revalidatePath("/admin/sucursales");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar sucursal o su dirección asociada:", error);
    return { success: false, error: "Error al eliminar sucursal o su dirección asociada." };
  }
}
