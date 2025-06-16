import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    let comunas;
    if (query) {
      comunas = await prisma.comuna.findMany({
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
        take: 10, // Limitar resultados para eficiencia
      });
    } else {
      comunas = await prisma.comuna.findMany({
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
        take: 20, // Limitar resultados iniciales
      });
    }

    return NextResponse.json(comunas);
  } catch (error) {
    console.error("Error fetching comunas:", error);
    return NextResponse.json({ error: "Error al obtener comunas" }, { status: 500 });
  }
}