"use server";

import { GeografiaService, ComunaConProvinciaYRegion } from '@/services/geografiaService';

/**
 * Define el tipo de resultado para las funciones que obtienen comunas.
 */
type GetComunasResult = { success: true; data: ComunaConProvinciaYRegion[] } | { success: false; message: string };

/**
 * Obtiene una lista de comunas, opcionalmente filtradas por un término de búsqueda.
 * Delega la lógica al `GeografiaService`.
 * @param search Término de búsqueda opcional para filtrar por nombre de comuna.
 * @returns Un objeto con el resultado de la operación y los datos de las comunas.
 */
export async function getComunas(search: string = ''): Promise<GetComunasResult> {
  try {
    // searchComunas del servicio ya retorna ComunaConProvinciaYRegion[] con la estructura anidada completa
    const comunas = await GeografiaService.searchComunas(search); 
    return { success: true, data: comunas };
  } catch (error: any) {
    console.error("Error fetching comunas (comunaActions):", error);
    return { success: false, message: error.message || "Failed to fetch comunas." };
  }
}

/**
 * Busca comunas por un término de búsqueda.
 * Esta función es un alias de `getComunas` para mantener compatibilidad si es necesario.
 * @param search Término de búsqueda para filtrar por nombre de comuna.
 * @returns Un objeto con el resultado de la operación y los datos de las comunas.
 */
export async function searchComunas(search: string): Promise<GetComunasResult> {
  return getComunas(search);
}
