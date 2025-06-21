"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { Empresa, Direccion } from "@prisma/client";
import type { ComunaConProvinciaYRegion } from './geografiaActions';

// Nota: El schema de Zod y los tipos de formulario se movieron a page.tsx
// para cumplir con la regla de "use server".

export type EmpresaConDetalles = Empresa & {
    direccionComercial: (Direccion & {
        comuna: ComunaConProvinciaYRegion | null;
    }) | null;
    _count: {
        sucursales: number;
        tickets: number;
    };
};

export async function createEmpresa(data: any): Promise<{ success: boolean, message: string }> {
    // La validación ahora se hace en el lado del servidor ANTES de llamar a esta acción,
    // pero podríamos añadir una capa extra aquí si fuera necesario.
    const { nombre, rut, telefono, calle, numero, comunaId } = data;
    try {
        await prisma.$transaction(async (tx) => {
            let direccionId: string | undefined = undefined;
            if (calle && numero && comunaId) {
                const nuevaDireccion = await tx.direccion.create({ data: { calle, numero, comunaId } });
                direccionId = nuevaDireccion.id;
            }
            await tx.empresa.create({
                data: { nombre, rut, telefono, direccionComercialId: direccionId },
            });
        });
        revalidatePath('/admin/empresas');
        return { success: true, message: 'Empresa creada con éxito.' };
    } catch (error: any) {
        if (error.code === 'P2002') return { success: false, message: 'El RUT o nombre de empresa ya existe.' };
        return { success: false, message: 'Ocurrió un error en el servidor.' };
    }
}

export async function updateEmpresa(id: string, data: any): Promise<{ success: boolean, message: string }> {
    const { nombre, rut, telefono, calle, numero, comunaId } = data;
    try {
        await prisma.$transaction(async (tx) => {
            const empresaActual = await tx.empresa.findUnique({ where: { id } });
            let direccionId = empresaActual?.direccionComercialId;
            if (calle && numero && comunaId) {
                const direccionData = { calle, numero, comunaId };
                if (direccionId) {
                    await tx.direccion.update({ where: { id: direccionId }, data: direccionData });
                } else {
                    const nuevaDireccion = await tx.direccion.create({ data: direccionData });
                    direccionId = nuevaDireccion.id;
                }
            } else if (direccionId) {
                await tx.empresa.update({ where: { id }, data: { direccionComercialId: null } });
                await tx.direccion.delete({ where: { id: direccionId } });
                direccionId = null;
            }
            await tx.empresa.update({
                where: { id },
                data: { nombre, rut, telefono, direccionComercialId: direccionId },
            });
        });
        revalidatePath('/admin/empresas');
        return { success: true, message: 'Empresa actualizada con éxito.' };
    } catch (error: any) {
        if (error.code === 'P2002') return { success: false, message: 'El RUT o nombre de empresa ya está en uso.' };
        return { success: false, message: 'Ocurrió un error en el servidor al actualizar.' };
    }
}

export async function deleteEmpresa(id: string): Promise<{ success: boolean, message: string }> {
    try {
        const empresaToDelete = await prisma.empresa.findUnique({
            where: { id },
            select: { direccionComercialId: true, _count: { select: { sucursales: true, tickets: true } } }
        });
        if (!empresaToDelete) return { success: false, message: "La empresa no existe." };
        if (empresaToDelete._count.sucursales > 0 || empresaToDelete._count.tickets > 0) {
            return { success: false, message: "No se puede eliminar: la empresa tiene sucursales o tickets asociados." };
        }
        await prisma.$transaction(async (tx) => {
            await tx.empresa.delete({ where: { id } });
            if (empresaToDelete.direccionComercialId) {
                await tx.direccion.delete({ where: { id: empresaToDelete.direccionComercialId } });
            }
        });
        revalidatePath('/admin/empresas');
        return { success: true, message: "Empresa eliminada con éxito." };
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return { success: false, message: "No se puede eliminar: la empresa tiene registros asociados." };
        }
        return { success: false, message: "Error al eliminar la empresa." };
    }
}

export async function getEmpresas(): Promise<EmpresaConDetalles[]> {
    const empresas = await prisma.empresa.findMany({
        orderBy: { nombre: 'asc' },
        include: {
            _count: { select: { sucursales: true, tickets: true } },
            direccionComercial: { include: { comuna: true } },
        },
    });
    return empresas as unknown as EmpresaConDetalles[];
}
