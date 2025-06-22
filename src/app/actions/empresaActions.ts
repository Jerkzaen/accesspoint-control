"use server";

import { EmpresaService, EmpresaCreateInput, EmpresaUpdateInput, EmpresaWithRelations } from "@/services/empresaService";
import { revalidatePath } from "next/cache"; // Importar revalidatePath si es necesario

/**
 * Obtiene todas las empresas.
 * @returns Un objeto con el resultado de la operación (éxito/error) y los datos de las empresas.
 */
export async function getEmpresasAction(): Promise<{ success: boolean; data?: EmpresaWithRelations[]; error?: string; }> {
  try {
    const empresas = await EmpresaService.getEmpresas(true); // Incluimos la dirección principal para la UI
    return { success: true, data: empresas };
  } catch (error: any) {
    console.error("Error en getEmpresasAction:", error);
    return { success: false, error: error.message || "Error desconocido al obtener empresas." };
  }
}

/**
 * Obtiene una empresa por su ID.
 * @param id El ID de la empresa.
 * @returns Un objeto con el resultado de la operación y los datos de la empresa.
 */
export async function getEmpresaByIdAction(id: string): Promise<{ success: boolean; data?: EmpresaWithRelations | null; error?: string; }> {
  try {
    const empresa = await EmpresaService.getEmpresaById(id);
    return { success: true, data: empresa };
  } catch (error: any) {
    console.error(`Error en getEmpresaByIdAction para ID ${id}:`, error);
    return { success: false, error: error.message || "Error desconocido al obtener la empresa." };
  }
}

/**
 * Crea una nueva empresa.
 * @param data Los datos de la nueva empresa.
 * @returns Un objeto con el resultado de la operación (éxito/error) y los datos de la empresa creada.
 */
export async function createEmpresaAction(data: EmpresaCreateInput): Promise<{ success: boolean; data?: EmpresaWithRelations; error?: string; }> {
  try {
    const newEmpresa = await EmpresaService.createEmpresa(data);
    revalidatePath("/admin/empresas"); // Revalida la ruta para mostrar los cambios
    return { success: true, data: newEmpresa };
  } catch (error: any) {
    console.error("Error en createEmpresaAction:", error);
    return { success: false, error: error.message || "Error desconocido al crear la empresa." };
  }
}

/**
 * Actualiza una empresa existente.
 * @param id El ID de la empresa a actualizar.
 * @param data Los datos a actualizar (parciales).
 * @returns Un objeto con el resultado de la operación (éxito/error) y los datos de la empresa actualizada.
 */
export async function updateEmpresaAction(id: string, data: EmpresaUpdateInput): Promise<{ success: boolean; data?: EmpresaWithRelations; error?: string; }> {
  try {
    const updatedEmpresa = await EmpresaService.updateEmpresa(id, data);
    revalidatePath("/admin/empresas"); // Revalida la ruta para mostrar los cambios
    return { success: true, data: updatedEmpresa };
  } catch (error: any) {
    console.error(`Error en updateEmpresaAction para ID ${id}:`, error);
    return { success: false, error: error.message || "Error desconocido al actualizar la empresa." };
  }
}

/**
 * Elimina una empresa.
 * @param id El ID de la empresa a eliminar.
 * @returns Un objeto con el resultado de la operación (éxito/error).
 */
export async function deleteEmpresaAction(id: string): Promise<{ success: boolean; message?: string; error?: string; }> {
  try {
    const result = await EmpresaService.deleteEmpresa(id);
    if (result.success) {
      revalidatePath("/admin/empresas"); // Revalida la ruta
      return { success: true, message: result.message };
    } else {
      return { success: false, error: result.message };
    }
  } catch (error: any) {
    console.error(`Error en deleteEmpresaAction para ID ${id}:`, error);
    return { success: false, error: error.message || "Error desconocido al eliminar la empresa." };
  }
}
