"use server";

import { SucursalService, SucursalCreateInput, SucursalUpdateInput, SucursalWithRelations } from "@/services/sucursalService";
import { revalidatePath } from "next/cache";

/**
 * Obtiene todas las sucursales.
 * @returns Un objeto con el resultado de la operación (éxito/error) y los datos de las sucursales.
 */
export async function getSucursalesAction(): Promise<{ success: boolean; data?: SucursalWithRelations[]; error?: string; }> {
  try {
    const sucursales = await SucursalService.getSucursales(true); // Incluimos relaciones para la UI
    return { success: true, data: sucursales };
  } catch (error: any) {
    console.error("Error en getSucursalesAction:", error);
    return { success: false, error: error.message || "Error desconocido al obtener sucursales." };
  }
}

/**
 * Obtiene una sucursal por su ID.
 * @param id El ID de la sucursal.
 * @returns Un objeto con el resultado de la operación y los datos de la sucursal.
 */
export async function getSucursalByIdAction(id: string): Promise<{ success: boolean; data?: SucursalWithRelations | null; error?: string; }> {
  try {
    const sucursal = await SucursalService.getSucursalById(id);
    return { success: true, data: sucursal };
  } catch (error: any) {
    console.error(`Error en getSucursalByIdAction para ID ${id}:`, error);
    return { success: false, error: error.message || "Error desconocido al obtener la sucursal." };
  }
}

/**
 * Crea una nueva sucursal.
 * @param data Los datos de la nueva sucursal.
 * @returns Un objeto con el resultado de la operación (éxito/error) y los datos de la sucursal creada.
 */
export async function createSucursalAction(data: SucursalCreateInput): Promise<{ success: boolean; data?: SucursalWithRelations; error?: string; }> {
  try {
    const newSucursal = await SucursalService.createSucursal(data);
    revalidatePath("/admin/sucursales"); // Revalida la ruta para mostrar los cambios
    return { success: true, data: newSucursal };
  } catch (error: any) {
    console.error("Error en createSucursalAction:", error);
    return { success: false, error: error.message || "Error desconocido al crear la sucursal." };
  }
}

/**
 * Actualiza una sucursal existente.
 * @param id El ID de la sucursal a actualizar.
 * @param data Los datos a actualizar (parciales).
 * @returns Un objeto con el resultado de la operación (éxito/error) y los datos de la sucursal actualizada.
 */
export async function updateSucursalAction(id: string, data: Partial<SucursalUpdateInput>): Promise<{ success: boolean; data?: SucursalWithRelations; error?: string; }> {
  try {
    // Asegurarse de pasar el ID dentro del objeto de datos al servicio
    const updatedSucursal = await SucursalService.updateSucursal({ id, ...data });
    revalidatePath("/admin/sucursales"); // Revalida la ruta para mostrar los cambios
    return { success: true, data: updatedSucursal };
  } catch (error: any) {
    console.error(`Error en updateSucursalAction para ID ${id}:`, error);
    return { success: false, error: error.message || "Error desconocido al actualizar la sucursal." };
  }
}

/**
 * Elimina una sucursal.
 * @param id El ID de la sucursal a eliminar.
 * @returns Un objeto con el resultado de la operación (éxito/error).
 */
export async function deleteSucursalAction(id: string): Promise<{ success: boolean; message?: string; error?: string; }> {
  try {
    const result = await SucursalService.deleteSucursal(id);
    if (result.success) {
      revalidatePath("/admin/sucursales"); // Revalida la ruta
      return { success: true, message: result.message };
    } else {
      return { success: false, error: result.message };
    }
  } catch (error: any) {
    console.error(`Error en deleteSucursalAction para ID ${id}:`, error);
    return { success: false, error: error.message || "Error desconocido al eliminar la sucursal." };
  }
}
