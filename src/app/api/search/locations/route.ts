// RUTA: src/app/api/search/locations/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
    // Usamos una transacción para ejecutar ambas búsquedas en paralelo.
    const [sucursales, comunas] = await prisma.$transaction([
      // Búsqueda de sucursales por nombre
      prisma.sucursal.findMany({
        where: {
          nombre: {
            contains: query,
            // Nota: SQLite no soporta búsqueda insensible a mayúsculas ('insensitive') aquí.
            // En PostgreSQL o MySQL se añadiría: mode: 'insensitive'
          },
        },
        // Usamos 'select' para devolver solo los datos necesarios al frontend.
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
        take: 5, // Limitamos a 5 resultados para un rendimiento óptimo.
      }),
      // Búsqueda de comunas por nombre
      prisma.comuna.findMany({
        where: {
          nombre: {
            contains: query,
          },
        },
        select: {
          id: true,
          nombre: true,
          provincia: {
            select: {
              nombre: true,
              region: {
                select: {
                  nombre: true,
                },
              },
            },
          },
        },
        take: 5,
      }),
    ]);

    // Devolvemos un objeto con ambos listados.
    return NextResponse.json({ sucursales, comunas });

  } catch (error) {
    console.error("Error en la búsqueda de ubicaciones:", error);
    return NextResponse.json(
      { message: "Error interno del servidor al realizar la búsqueda." },
      { status: 500 }
    );
  }
}
