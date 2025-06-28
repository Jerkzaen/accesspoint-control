// src/services/empresaService.ts

import { prisma } from "@/lib/prisma";
import { Prisma, Empresa, ContactoEmpresa, Direccion, Ticket, Sucursal, EquipoInventario, EstadoEmpresa } from "@prisma/client";
import { createEmpresaSchema, updateEmpresaSchema } from "@/lib/validators/empresaValidator"; 
import { z } from "zod";

export type EmpresaCreateInput = z.infer<typeof createEmpresaSchema>;
export type EmpresaUpdateInput = z.infer<typeof updateEmpresaSchema>;


export class EmpresaService {

  static async getEmpresas(estado: EstadoEmpresa = EstadoEmpresa.ACTIVA): Promise<Empresa[]> {
    return prisma.empresa.findMany({
      where: { estado },
      include: {
        direccionPrincipal: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  static async getEmpresaById(id: string): Promise<Empresa | null> {
    return prisma.empresa.findUnique({
      where: { id },
      include: {
        direccionPrincipal: true,
        contactos: true,
        sucursales: true,
      },
    });
  }

  /**
   * CORREGIDO: Crea una nueva empresa, asegurando que los datos para la dirección
   * se construyan de la forma que Prisma espera.
   */
  static async createEmpresa(data: EmpresaCreateInput): Promise<Empresa> {
    const validatedData = createEmpresaSchema.parse(data);

    return prisma.$transaction(async (tx) => {
      let direccionId: string | undefined = undefined; 

      if (validatedData.direccionPrincipal) {
        // CORRECCIÓN: Separamos comunaId del resto de los datos de dirección
        const { comunaId, ...direccionData } = validatedData.direccionPrincipal;
        
        const nuevaDireccion = await tx.direccion.create({
          data: {
            ...direccionData, // calle, numero, depto
            comuna: { connect: { id: comunaId } }, // Conectamos la relación aquí
          },
        });
        direccionId = nuevaDireccion.id;
      }

      return tx.empresa.create({
        data: {
          nombre: validatedData.nombre,
          rut: validatedData.rut,
          logoUrl: validatedData.logoUrl,
          telefono: validatedData.telefono,
          email: validatedData.email,
          direccionPrincipal: direccionId ? { connect: { id: direccionId } } : undefined,
        },
      });
    });
  }

  static async updateEmpresa(id: string, data: EmpresaUpdateInput): Promise<Empresa> {
    const validatedData = updateEmpresaSchema.parse(data);
    
    return prisma.empresa.update({
      where: { id },
      data: {
        nombre: validatedData.nombre,
        rut: validatedData.rut,
        email: validatedData.email,
        telefono: validatedData.telefono,
        logoUrl: validatedData.logoUrl,
      },
    });
  }

  static async deactivateEmpresa(id: string): Promise<Empresa> {
    return prisma.empresa.update({
      where: { id },
      data: {
        estado: EstadoEmpresa.INACTIVA,
      },
    });
  }
}

