"use server";

import { prisma } from "@/lib/prisma";
import type { Comuna, Provincia, Region } from '@prisma/client';

/**
 * Define el tipo de dato para una Comuna que incluye su Provincia y Región.
 * Es importante para asegurar que los datos que se pasan del servidor al cliente
 * sean predecibles y seguros.
 */
export type ComunaConProvinciaYRegion = {
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

export async function getRegiones() {
  try {
    return await prisma.region.findMany({
      orderBy: {
        nombre: 'asc'
      }
    });
  } catch (error) {
    console.error("Error al obtener regiones:", error);
    return [];
  }
}

export async function getComunasByRegion(regionId: string) {
    if (!regionId) return [];
    try {
        return await prisma.comuna.findMany({
            where: { provincia: { regionId: regionId } },
            include: {
                provincia: true,
            },
            orderBy: {
                nombre: 'asc'
            }
        });
    } catch (error) {
        console.error("Error al obtener comunas por región:", error);
        return [];
    }
}

/**
 * Tipo interno para el resultado de la consulta de Prisma.
 * Esto ayuda a TypeScript a entender la estructura anidada.
 */
type ComunaFromPrisma = Comuna & {
  provincia: Provincia & {
    region: Region;
  };
};

/**
 * Busca comunas por un término de búsqueda.
 * @param searchTerm El texto a buscar en los nombres de las comunas.
 * @returns Un objeto con el resultado de la operación, incluyendo los datos o un mensaje de error.
 */
export async function searchComunas(searchTerm: string): Promise<{ success: boolean; data?: ComunaConProvinciaYRegion[]; error?: string; }> {
  if (!searchTerm.trim()) {
    return { success: true, data: [] };
  }

  try {
    // CORRECCIÓN 1: Se tipa explícitamente la constante `comunas`.
    const comunas: ComunaFromPrisma[] = await prisma.comuna.findMany({
      where: {
        nombre: {
          contains: searchTerm,
          // CORRECCIÓN 2: Se elimina `mode: 'insensitive'` porque no es compatible con SQLite.
        },
      },
      include: {
        provincia: {
          include: {
            region: true,
          },
        },
      },
      take: 10,
    });

    // Ahora el .map() funcionará sin errores de tipo.
    const serializedComunas: ComunaConProvinciaYRegion[] = comunas.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      provincia: {
        id: c.provincia.id,
        nombre: c.provincia.nombre,
        region: {
          id: c.provincia.region.id,
          nombre: c.provincia.region.nombre,
        }
      }
    }));

    return { success: true, data: serializedComunas };
  } catch (error) {
    console.error('Error al buscar comunas:', error);
    return { success: false, error: 'No se pudieron buscar las comunas.' };
  }
}
