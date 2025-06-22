"use server";

import { GeografiaService, DireccionConRelaciones } from "@/services/geografiaService";
import type { Direccion } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Tipo para los datos de entrada al añadir o actualizar una dirección.
 * Ya no incluye 'empresaId' porque la relación se gestiona desde el modelo Empresa.
 */
export type DireccionInput = {
  calle: string;
  numero: string;
  depto?: string; // Hacer depto opcional en el input
  comunaId: string;
};

/**
 * Obtiene todas las direcciones, incluyendo sus relaciones geográficas completas.
 * Delega la lógica al `GeografiaService`.
 * @returns Una promesa que resuelve con un array de objetos DireccionConRelaciones.
 */
export async function getDirecciones(): Promise<DireccionConRelaciones[]> {
  try {
    const direcciones = await GeografiaService.getDirecciones();
    return direcciones;
  } catch (error) {
    console.error("Error al obtener direcciones (direccionActions):", error);
    return []; // Retorna un array vacío en caso de error para no romper la UI
  }
}

/**
 * Añade una nueva dirección.
 * Delega la lógica al `GeografiaService`.
 * @param data Los datos de la nueva dirección.
 * @returns Un objeto con el resultado de la operación (éxito/error) y los datos.
 */
export async function addDireccion(data: DireccionInput) {
  try {
    // La lógica de Prisma ya no necesita 'empresa' o 'empresaId' aquí
    // ya que esa relación ahora se maneja desde el modelo Empresa.
    const newDireccion = await GeografiaService.addDireccion(data);
    revalidatePath("/admin/direcciones"); // Revalida la ruta si es necesario para mostrar los cambios
    return { success: true, data: newDireccion };
  } catch (error: any) {
    console.error("Error al añadir dirección (direccionActions):", error);
    return { success: false, error: error.message || "Error desconocido al añadir dirección." };
  }
}

/**
 * Actualiza una dirección existente.
 * Delega la lógica al `GeografiaService`.
 * @param id El ID de la dirección a actualizar.
 * @param data Los datos a actualizar (parciales).
 * @returns Un objeto con el resultado de la operación (éxito/error) y los datos.
 */
export async function updateDireccion(id: string, data: Partial<DireccionInput>) {
  try {
    // La lógica de Prisma ya no necesita 'empresa' o 'empresaId' aquí.
    const updatedDireccion = await GeografiaService.updateDireccion(id, data);
    revalidatePath("/admin/direcciones"); // Revalida la ruta si es necesario
    return { success: true, data: updatedDireccion };
  } catch (error: any) {
    console.error("Error al actualizar dirección (direccionActions):", error);
    return { success: false, error: error.message || "Error desconocido al actualizar dirección." };
  }
}

/**
 * Elimina una dirección.
 * Delega la lógica al `GeografiaService`.
 * @param id El ID de la dirección a eliminar.
 * @returns Un objeto con el resultado de la operación (éxito/error).
 */
export async function deleteDireccion(id: string) {
  try {
    await GeografiaService.deleteDireccion(id);
    revalidatePath("/admin/direcciones"); // Revalida la ruta si es necesario
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar dirección (direccionActions):", error);
    return { success: false, error: error.message || "Error desconocido al eliminar dirección." };
  }
}
