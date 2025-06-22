// RUTA: src/app/api/search/locations/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { GeografiaService } from '@/services/geografiaService'; // Mantener el servicio para otros usos si es necesario
import { prisma } from '@/lib/prisma'; // Importar la instancia de Prisma

export const dynamic = 'force-dynamic';

/**
 * GET handler para buscar sucursales y comunas por un término de búsqueda.
 * Utiliza una transacción para asegurar la atomicidad de ambas búsquedas.
 * @param request La solicitud Next.js.
 * @returns Una respuesta JSON con las sucursales y comunas encontradas o un mensaje de error.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  // Si no hay consulta o es muy corta, no devolvemos nada.
  if (!query || query.trim().length < 2) {
    return NextResponse.json({
      sucursales: [],
      comunas: [],
    });
  }

  try {
    // Usamos la sobrecarga funcional de $transaction para asegurar que ambas operaciones
    // utilicen el cliente transaccional y se tipen correctamente.
    const [sucursales, comunasRaw] = await prisma.$transaction(async (tx) => {
      // Búsqueda de sucursales por nombre utilizando el cliente transaccional (tx)
      const sucursalesResult = await tx.sucursal.findMany({
        where: {
          nombre: {
            contains: query,
            // Nota: SQLite no soporta 'mode: insensitive' aquí.
          },
        },
        select: {
          id: true,
          nombre: true,
          empresa: {
            select: { nombre: true },
          },
          direccion: {
            select: {
              calle: true,
              numero: true,
              comuna: {
                select: { nombre: true },
              },
            },
          },
        },
        take: 5,
      });

      // Búsqueda de comunas por nombre utilizando el cliente transaccional (tx)
      // Aseguramos que la selección de campos coincida con ComunaConProvinciaYRegion para el tipado.
      const comunasResult = await tx.comuna.findMany({
        where: {
          nombre: {
            contains: query,
          },
        },
        include: { // Incluimos las relaciones necesarias para el tipo ComunaConProvinciaYRegion
          provincia: {
            include: {
              region: true,
            },
          },
        },
        take: 5,
      });

      // Retornamos ambos resultados del callback de la transacción
      return [sucursalesResult, comunasResult];
    });

    // Adaptar el resultado del servicio de comunas al formato esperado por esta API
    // Aseguramos el acceso a las propiedades anidadas correctamente.
    const comunas = comunasRaw.map(c => ({
      id: c.id,
      nombre: c.nombre,
      provincia: {
        nombre: c.provincia.nombre,
        region: {
          nombre: c.provincia.region.nombre,
        },
      },
    }));

    // Devolvemos un objeto con ambos listados.
    return NextResponse.json({ sucursales, comunas });

  } catch (error) {
    console.error("Error en la búsqueda de ubicaciones (API Route):", error);
    return NextResponse.json(
      { message: "Error interno del servidor al realizar la búsqueda." },
      { status: 500 }
    );
  }
}
