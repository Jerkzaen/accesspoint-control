'use server';

import { prisma } from "@/lib/prisma";
import type { Empresa as PrismaEmpresa, Direccion as PrismaDireccion, Prisma } from '@prisma/client';
import { revalidatePath } from "next/cache";

// Corregido: Asegura que direccionComercialId es explícitamente string | null
// También asegúrate de que todos los campos del modelo PrismaEmpresa se manejen correctamente.
export type EmpresaWithDireccion = PrismaEmpresa & { 
  direccionComercial: PrismaDireccion | null;
};

export type EmpresaInput = {
  nombre: string;
  rut?: string | null;
  logoUrl?: string | null; 
  telefono?: string | null;
  email?: string | null;
  direccion?: {
    calle?: string | null;
    numero?: string | null;
    comunaId?: string | null;
  } | null;
};

type GetEmpresasResult = { success: true; data: EmpresaWithDireccion[] } | { success: false; error: string };


export async function getEmpresas(): Promise<GetEmpresasResult> {
  try {
    const empresas = await prisma.empresa.findMany({
      orderBy: { nombre: 'asc' },
      include: { direccionComercial: true }, 
    });
    const typedEmpresas: EmpresaWithDireccion[] = empresas.map(emp => ({
      ...emp,
      direccionComercial: emp.direccionComercial, // Asegura que la relación se mantenga
    })) as EmpresaWithDireccion[]; 
    return { success: true, data: typedEmpresas };
  } catch (error: any) {
    console.error("Error al obtener empresas:", error);
    return { success: false, error: "Error al obtener empresas." };
  }
}

export async function addEmpresa(data: EmpresaInput) {
  try {
    let direccionComercialId: string | undefined;

    if (data.direccion && (data.direccion.calle || data.direccion.numero || data.direccion.comunaId)) {
      const existingDireccion = await prisma.direccion.findFirst({
        where: {
          calle: data.direccion.calle || '',
          numero: data.direccion.numero || '',
          comunaId: data.direccion.comunaId || undefined,
        },
      });

      if (existingDireccion) {
        direccionComercialId = existingDireccion.id;
      } else {
        const newDireccion = await prisma.direccion.create({
            data: {
              comuna: { connect: { id: data.direccion.comunaId || '' } },
              calle: data.direccion.calle || '',
              numero: data.direccion.numero || '',
            },
          });
          direccionComercialId = newDireccion.id;
      }
    }

    const newEmpresa = await prisma.empresa.create({
      data: {
        nombre: data.nombre,
        rut: data.rut,
        logoUrl: data.logoUrl,
        telefono: data.telefono,
        email: data.email,
        direccionComercial: direccionComercialId ? { connect: { id: direccionComercialId } } : undefined,
      },
      include: { 
        direccionComercial: true
      }
    });

    revalidatePath('/admin/empresas');
    return { success: true, data: newEmpresa as EmpresaWithDireccion }; 
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
    let direccionComercialId: string | undefined;
    // Corregido: Obtener todos los campos necesarios para que el tipo coincida con EmpresaWithDireccion
    let existingEmpresa = await prisma.empresa.findUnique({
      where: { id },
      include: { direccionComercial: true } // Incluye la relación completa
    }) as EmpresaWithDireccion | null; // Casting para asegurar el tipo

    // Si la empresa no se encuentra, manejar el error
    if (!existingEmpresa) {
        return { success: false, error: "Empresa no encontrada para actualizar." };
    }


    if (data.direccion && (data.direccion.calle || data.direccion.numero || data.direccion.comunaId)) {
      if (existingEmpresa.direccionComercialId) { // Usa existingEmpresa.direccionComercialId directamente
        const updatedDireccion = await prisma.direccion.update({
          where: { id: existingEmpresa.direccionComercialId },
          data: {
            comuna: { connect: { id: data.direccion.comunaId || '' } },
            calle: data.direccion.calle || '',
            numero: data.direccion.numero || '',
          },
        });
        direccionComercialId = updatedDireccion.id;
      } else {
        const newDireccion = await prisma.direccion.create({
        data: {
          comuna: { connect: { id: data.direccion.comunaId || '' } },
          calle: data.direccion.calle || '',
          numero: data.direccion.numero || '',
        },
      });
      direccionComercialId = newDireccion.id;
      }
    } else if (existingEmpresa.direccionComercialId && !data.direccion) {
      await prisma.empresa.update({
        where: { id },
        data: {
          direccionComercial: { disconnect: true }
        }
      });
      await prisma.direccion.delete({
        where: { id: existingEmpresa.direccionComercialId }
      });
      direccionComercialId = undefined; 
    } else if (!existingEmpresa.direccionComercialId && !data.direccion) {
        direccionComercialId = undefined;
    }


    const updatedEmpresa = await prisma.empresa.update({
      where: { id },
      data: {
        nombre: data.nombre,
        rut: data.rut,
        logoUrl: data.logoUrl,
        telefono: data.telefono,
        email: data.email,
        direccionComercial: direccionComercialId ? { connect: { id: direccionComercialId } } : undefined,
      },
      include: { 
        direccionComercial: true
      }
    });

    revalidatePath('/admin/empresas');
    return { success: true, data: updatedEmpresa as EmpresaWithDireccion };
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
    const empresaToDelete = await prisma.empresa.findUnique({
      where: { id },
      select: { direccionComercialId: true }
    });

    await prisma.empresa.delete({
      where: { id },
    });

    if (empresaToDelete?.direccionComercialId) {
      await prisma.direccion.delete({
        where: { id: empresaToDelete.direccionComercialId }
      });
    }

    revalidatePath('/admin/empresas');
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar empresa:", error);
    return { success: false, error: "Error al eliminar empresa." };
  }
}
