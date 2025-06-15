'use server';

import { prisma } from "@/lib/prisma";
import { Empresa, Direccion } from '@prisma/client';
import { revalidatePath } from "next/cache";

export type EmpresaWithDireccion = Empresa & { direccion: Direccion | null };
type GetEmpresasResult = { success: true; data: EmpresaWithDireccion[] } | { success: false; error: string };

type EmpresaInput = {
  nombre: string;
  rut?: string | null;
  logoUrl?: string | null;
  // telefono?: string | null;
  // email?: string | null;
  direccion?: {
    pais?: string | null;
    region?: string | null;
    provincia?: string | null;
    comuna?: string | null;
    calle?: string | null;
    numero?: string | null;
  } | null;
};

export async function getEmpresas(): Promise<GetEmpresasResult> {
  try {
    const empresas = await prisma.empresa.findMany({
      orderBy: { nombre: 'asc' },
      include: { direccion: true },
    });
    const typedEmpresas: EmpresaWithDireccion[] = empresas as EmpresaWithDireccion[];
    return { success: true, data: typedEmpresas };
  } catch (error) {
    console.error("Error al obtener empresas:", error);
    return { success: false, error: "Error al obtener empresas." };
  }
}

export async function addEmpresa(data: EmpresaInput) {
  try {
    let direccionId: string | undefined;
    if (data.direccion) {
      const newDireccion = await prisma.direccion.create({
        data: {
          pais: data.direccion.pais || '',
          region: data.direccion.region || '',
          provincia: data.direccion.provincia || '',
          comuna: data.direccion.comuna || '',
          calle: data.direccion.calle || '',
          numero: data.direccion.numero || '',
        },
      });
      direccionId = newDireccion.id;
    }

    const newEmpresa = await prisma.empresa.create({
      data: {
        nombre: data.nombre,
        rut: data.rut,
        logoUrl: data.logoUrl,
        // telefono: data.telefono,
        // email: data.email,
        direccion: direccionId ? { connect: { id: direccionId } } : undefined,
      },
    });
    revalidatePath('/admin/empresas');
    return { success: true, data: newEmpresa };
  } catch (error: any) {
    console.error("Error al añadir empresa:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
      return { success: false, error: "Ya existe una empresa con ese nombre." };
    }
    return { success: false, error: "Error al añadir empresa." };
  }
}

export async function updateEmpresa(id: string, data: EmpresaInput) {
  try {
    let direccionId: string | undefined;
    if (data.direccion) {
      // Check if an existing direccion is linked to this empresa
      const existingEmpresa = await prisma.empresa.findUnique({
        where: { id },
        select: { direccionId: true }
      });

      if (existingEmpresa?.direccionId) {
        // Update existing direccion
        const updatedDireccion = await prisma.direccion.update({
          where: { id: existingEmpresa.direccionId },
          data: {
            pais: data.direccion.pais || '',
            region: data.direccion.region || '',
            provincia: data.direccion.provincia || '',
            comuna: data.direccion.comuna || '',
            calle: data.direccion.calle || '',
            numero: data.direccion.numero || '',
          },
        });
        direccionId = updatedDireccion.id;
      } else {
        // Create new direccion if none exists
        const newDireccion = await prisma.direccion.create({
          data: {
          pais: data.direccion.pais || '',
          region: data.direccion.region || '',
          provincia: data.direccion.provincia || '',
          comuna: data.direccion.comuna || '',
          calle: data.direccion.calle || '',
          numero: data.direccion.numero || '',
          },
        });
        direccionId = newDireccion.id;
      }
    }

    const updatedEmpresa = await prisma.empresa.update({
      where: { id },
      data: {
        nombre: data.nombre,
        rut: data.rut,
        logoUrl: data.logoUrl,
        // telefono: data.telefono,
        // email: data.email,
        direccion: direccionId ? { connect: { id: direccionId } } : undefined,
      },
    });
    revalidatePath('/admin/empresas');
    return { success: true, data: updatedEmpresa };
  } catch (error: any) {
    console.error("Error al actualizar empresa:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
      return { success: false, error: "Ya existe una empresa con ese nombre." };
    }
    return { success: false, error: "Error al actualizar empresa." };
  }
}

export async function deleteEmpresa(id: string) {
  try {
    // First, find the empresa to get its direccionId
    const empresaToDelete = await prisma.empresa.findUnique({
      where: { id },
      select: { direccionId: true }
    });

    // Delete the empresa
    await prisma.empresa.delete({
      where: { id },
    });

    // If a direccion was linked, delete it as well
    if (empresaToDelete?.direccionId) {
      await prisma.direccion.delete({
        where: { id: empresaToDelete.direccionId }
      });
    }

    revalidatePath('/admin/empresas');
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar empresa:", error);
    return { success: false, error: "Error al eliminar empresa." };
  }
}