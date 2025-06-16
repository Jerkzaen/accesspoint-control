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
    // Primero, encuentra la sucursal para obtener el ID de la dirección asociada
    const sucursalToDelete = await prisma.sucursal.findUnique({
      where: { id },
      select: { direccionId: true, empresaId: true },
    });

    if (!sucursalToDelete || !sucursalToDelete.direccionId) {
      return { success: false, error: "Sucursal o dirección asociada no encontrada." };
    }

    // Desconectar la sucursal de la empresa antes de eliminarla
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

    // Elimina la sucursal
    await prisma.sucursal.delete({
      where: { id },
    });

    // Luego, elimina la dirección asociada
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