"use server";

import { prisma } from "@/lib/prisma";
import { Direccion } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type DireccionInput = {
  calle: string;
  numero: string;
  comuna: string;
  provincia: string;
  region: string;
  pais: string;
};

export async function getDirecciones(): Promise<Direccion[]> {
  try {
    const direcciones = await prisma.direccion.findMany({
      orderBy: {
        calle: "asc",
      },
    });
    return direcciones;
  } catch (error) {
    console.error("Error al obtener direcciones:", error);
    return [];
  }
}

export async function addDireccion(data: DireccionInput) {
  try {
    const newDireccion = await prisma.direccion.create({
      data: {
        calle: data.calle,
        numero: data.numero,
        comuna: data.comuna,
        provincia: data.provincia,
        region: data.region,
        pais: data.pais,
      },
    });
    revalidatePath("/admin/direcciones");
    return { success: true, data: newDireccion };
  } catch (error) {
    console.error("Error al añadir dirección:", error);
    return { success: false, error: "Error al añadir dirección." };
  }
}

export async function updateDireccion(id: string, data: Partial<DireccionInput>) {
  try {
    const updatedDireccion = await prisma.direccion.update({
      where: { id },
      data: {
        calle: data.calle,
        numero: data.numero,
        comuna: data.comuna,
        provincia: data.provincia,
        region: data.region,
        pais: data.pais,
      },
    });
    revalidatePath("/admin/direcciones");
    return { success: true, data: updatedDireccion };
  } catch (error) {
    console.error("Error al actualizar dirección:", error);
    return { success: false, error: "Error al actualizar dirección." };
  }
}

export async function deleteDireccion(id: string) {
  try {
    await prisma.direccion.delete({
      where: { id },
    });
    revalidatePath("/admin/direcciones");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar dirección:", error);
    return { success: false, error: "Error al eliminar dirección." };
  }
}