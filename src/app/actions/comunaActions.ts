import { Comuna, Provincia, Region } from '@prisma/client';
'use server';

import { prisma } from '@/lib/prisma';

export type ComunaWithProvinciaAndRegion = Comuna & {
  provincia: Provincia & {
    region: Region;
  };
};

type GetComunasResult = { success: true; data: ComunaWithProvinciaAndRegion[] } | { success: false; error: string };

export async function getComunas(search: string): Promise<{ success: true; data: ComunaWithProvinciaAndRegion[] } | { success: false; error: string }> {
  try {
    console.log('getComunas called with search:', search);
    console.log('Is prisma defined?', !!prisma);
    console.log('Is prisma.comuna defined?', !!prisma.comuna);

    const comunas = await prisma.comuna.findMany({
        where: search
          ? {
              nombre: {
                contains: search,
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
  } catch (error) {
    console.error("Error fetching comunas:", error);
    return { success: false, error: "Failed to fetch comunas." };
  }
}

export async function searchComunas(search: string): Promise<{ success: true; data: ComunaWithProvinciaAndRegion[] } | { success: false; error: string }> {
  return getComunas(search);
}
