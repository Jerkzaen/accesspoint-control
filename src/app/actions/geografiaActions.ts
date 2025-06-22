"use server";

import { GeografiaService, ComunaConProvinciaYRegion } from "@/services/geografiaService";
import type { Region } from '@prisma/client';

/**
 * Obtiene todas las regiones disponibles.
 * @returns Un objeto con el resultado de la operación (éxito/error) y los datos.
 */
export async function getRegiones(): Promise<{ success: boolean; data?: Region[]; error?: string; }> {
  try {
    const regiones = await GeografiaService.getRegiones();
    return { success: true, data: regiones };
  } catch (error: any) {
    console.error("Error en getRegiones (geografiaActions):", error);
    return { success: false, error: error.message || "Error desconocido al obtener regiones." };
  }
}

/**
 * Obtiene comunas filtradas por una ID de región.
 * Ahora se asegura de que el tipo retornado por el servicio incluya la región anidada.
 * @param regionId El ID de la región para filtrar las comunas.
 * @returns Un objeto con el resultado de la operación y los datos de las comunas.
 */
export async function getComunasByRegion(regionId: string): Promise<{ success: boolean; data?: ComunaConProvinciaYRegion[]; error?: string; }> {
    if (!regionId) {
        return { success: true, data: [] };
    }
    try {
        // GeografiaService.getComunasByRegion ya devuelve ComunaConProvinciaYRegion con la región incluida
        const comunas = await GeografiaService.getComunasByRegion(regionId);
        return { success: true, data: comunas };
    } catch (error: any) {
        console.error("Error en getComunasByRegion (geografiaActions):", error);
        return { success: false, error: error.message || "Error desconocido al obtener comunas por región." };
    }
}

/**
 * Busca comunas por un término de búsqueda.
 * @param searchTerm El texto a buscar en los nombres de las comunas.
 * @returns Un objeto con el resultado de la operación (éxito/error) y los datos de las comunas.
 */
export async function searchComunas(searchTerm: string): Promise<{ success: boolean; data?: ComunaConProvinciaYRegion[]; error?: string; }> {
  if (!searchTerm.trim()) {
    return { success: true, data: [] };
  }
  try {
    const comunas = await GeografiaService.searchComunas(searchTerm);
    return { success: true, data: comunas };
  } catch (error: any) {
    console.error('Error en searchComunas (geografiaActions):', error);
    return { success: false, error: error.message || 'No se pudieron buscar las comunas.' };
  }
}
