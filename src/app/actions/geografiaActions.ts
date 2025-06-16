'use server';

import { prisma } from "@/lib/prisma";
import { Pais, Region, Provincia, Comuna } from "@prisma/client";

// Tipos de entrada para la creación/actualización
export type PaisInput = Omit<Pais, 'id' | 'createdAt' | 'updatedAt'>;
export type RegionInput = Omit<Region, 'id' | 'createdAt' | 'updatedAt'>;
export type ProvinciaInput = Omit<Provincia, 'id' | 'createdAt' | 'updatedAt'>;
export type ComunaInput = Omit<Comuna, 'id' | 'createdAt' | 'updatedAt'>;

export async function getPaises(): Promise<Pais[]> {
  try {
    const paises = await prisma.pais.findMany({
      orderBy: { nombre: 'asc' },
    });
    return paises;
  } catch (error) {
    console.error("Error al obtener países:", error);
    return [];
  }
}

export async function addPais(data: PaisInput): Promise<Pais | null> {
  try {
    const newPais = await prisma.pais.create({ data });
    return newPais;
  } catch (error) {
    console.error("Error al añadir país:", error);
    return null;
  }
}

export async function updatePais(id: string, data: Partial<PaisInput>): Promise<Pais | null> {
  try {
    const updatedPais = await prisma.pais.update({
      where: { id },
      data,
    });
    return updatedPais;
  } catch (error) {
    console.error("Error al actualizar país:", error);
    return null;
  }
}

export async function deletePais(id: string): Promise<Pais | null> {
  try {
    const deletedPais = await prisma.pais.delete({ where: { id } });
    return deletedPais;
  } catch (error) {
    console.error("Error al eliminar país:", error);
    return null;
  }
}

// --- Acciones para Región ---
export async function getRegiones(paisId?: string): Promise<Region[]> {
  try {
    const regiones = await prisma.region.findMany({
      where: paisId ? { paisId } : undefined,
      orderBy: { nombre: 'asc' },
    });
    return regiones;
  } catch (error) {
    console.error("Error al obtener regiones:", error);
    return [];
  }
}

export async function addRegion(data: RegionInput): Promise<Region | null> {
  try {
    const newRegion = await prisma.region.create({ data });
    return newRegion;
  } catch (error) {
    console.error("Error al añadir región:", error);
    return null;
  }
}

export async function updateRegion(id: string, data: Partial<RegionInput>): Promise<Region | null> {
  try {
    const updatedRegion = await prisma.region.update({
      where: { id },
      data,
    });
    return updatedRegion;
  } catch (error) {
    console.error("Error al actualizar región:", error);
    return null;
  }
}

export async function deleteRegion(id: string): Promise<Region | null> {
  try {
    const deletedRegion = await prisma.region.delete({ where: { id } });
    return deletedRegion;
  } catch (error) {
    console.error("Error al eliminar región:", error);
    return null;
  }
}

// --- Acciones para Provincia ---
export async function getProvincias(regionId?: string): Promise<Provincia[]> {
  try {
    const provincias = await prisma.provincia.findMany({
      where: regionId ? { regionId } : undefined,
      orderBy: { nombre: 'asc' },
    });
    return provincias;
  } catch (error) {
    console.error("Error al obtener provincias:", error);
    return [];
  }
}

export async function addProvincia(data: ProvinciaInput): Promise<Provincia | null> {
  try {
    const newProvincia = await prisma.provincia.create({ data });
    return newProvincia;
  } catch (error) {
    console.error("Error al añadir provincia:", error);
    return null;
  }
}

export async function updateProvincia(id: string, data: Partial<ProvinciaInput>): Promise<Provincia | null> {
  try {
    const updatedProvincia = await prisma.provincia.update({
      where: { id },
      data,
    });
    return updatedProvincia;
  } catch (error) {
    console.error("Error al actualizar provincia:", error);
    return null;
  }
}

export async function deleteProvincia(id: string): Promise<Provincia | null> {
  try {
    const deletedProvincia = await prisma.provincia.delete({ where: { id } });
    return deletedProvincia;
  } catch (error) {
    console.error("Error al eliminar provincia:", error);
    return null;
  }
}

// --- Acciones para Comuna ---
export async function getComunas(provinciaId?: string): Promise<Comuna[]> {
  try {
    const comunas = await prisma.comuna.findMany({
      where: provinciaId ? { provinciaId } : undefined,
      orderBy: { nombre: 'asc' },
    });
    return comunas;
  } catch (error) {
    console.error("Error al obtener comunas:", error);
    return [];
  }
}

export async function addComuna(data: ComunaInput): Promise<Comuna | null> {
  try {
    const newComuna = await prisma.comuna.create({ data });
    return newComuna;
  } catch (error) {
    console.error("Error al añadir comuna:", error);
    return null;
  }
}

export async function updateComuna(id: string, data: Partial<ComunaInput>): Promise<Comuna | null> {
  try {
    const updatedComuna = await prisma.comuna.update({
      where: { id },
      data,
    });
    return updatedComuna;
  } catch (error) {
    console.error("Error al actualizar comuna:", error);
    return null;
  }
}

export async function deleteComuna(id: string): Promise<Comuna | null> {
  try {
    const deletedComuna = await prisma.comuna.delete({ where: { id } });
    return deletedComuna;
  } catch (error) {
    console.error("Error al eliminar comuna:", error);
    return null;
  }
}

export async function getComunaById(id: string): Promise<(Comuna & { provincia: (Provincia & { region: (Region & { pais: Pais }) }) }) | null> {
  try {
    const comuna = await prisma.comuna.findUnique({
      where: { id },
      include: {
        provincia: {
          include: {
            region: {
              include: {
                pais: true,
              },
            },
          },
        },
      },
    });
    return comuna;
  } catch (error) {
    console.error("Error al obtener comuna por ID:", error);
    return null;
  }
}

export async function searchComunas(query: string): Promise<Array<Comuna & { provincia: (Provincia & { region: (Region & { pais: Pais }) }) }>> {
  try {
    const comunas = await prisma.comuna.findMany({
      where: {
        nombre: {
          contains: query,

        },
      },
      include: {
        provincia: {
          include: {
            region: {
              include: {
                pais: true,
              },
            },
          },
        },
      },
      take: 10,
    });
    return comunas;
  } catch (error) {
    console.error("Error al buscar comunas:", error);
    return [];
  }
}