import { Comuna, Provincia, Region } from '@prisma/client';
'use server';

import { prisma } from '@/lib/prisma';

export type ComunaWithProvinciaAndRegion = Comuna & {
  provincia: Provincia & {
    region: Region;
  };
};

type GetComunasResult = { success: true; data: ComunaWithProvinciaAndRegion[] } | { success: false; message: string };

export async function getComunas(search: string): Promise<GetComunasResult> {
  try {
    const comunas = await prisma.comuna.findMany({
        where: search
          ? {
              nombre: {
                contains: search,
                // CAMBIO: Se elimina 'mode: insensitive' porque no es reconocido por el tipo de filtro actual
                // Para SQLite, 'contains' (LIKE) suele ser insensible a mayúsculas/minúsculas por defecto.
              },
            }
          : undefined,
        select: {
          id: true,
          nombre: true,
          provinciaId: true,
          createdAt: true,
          updatedAt: true,
          provincia: {
            select: {
              id: true,
              nombre: true,
              regionId: true,
              createdAt: true,
              updatedAt: true,
              region: true,
            },
          },
        },

      orderBy: {
        nombre: 'asc',
      },
    });
    return { success: true, data: comunas as ComunaWithProvinciaAndRegion[] };
  } catch (error: any) {
    console.error("Error fetching comunas:", error);
    return { success: false, message: error.message || "Failed to fetch comunas." };
  }
}

export async function searchComunas(search: string): Promise<GetComunasResult> {
  return getComunas(search);
}

