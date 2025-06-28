// src/services/contactoEmpresaService.ts

import { prisma } from "@/lib/prisma";
import { Prisma, ContactoEmpresa, Empresa, Ubicacion, EstadoContacto } from "@prisma/client";
import { createContactoEmpresaSchema, updateContactoEmpresaSchema } from "@/lib/validators/contactoEmpresaValidator";
import { z } from "zod";


export type ContactoEmpresaCreateInput = z.infer<typeof createContactoEmpresaSchema>;
export type ContactoEmpresaUpdateInput = z.infer<typeof updateContactoEmpresaSchema>;


export class ContactoEmpresaService {

  /**
   * Obtiene todos los contactos, por defecto solo los ACTIVOS.
   */
  static async getContactosEmpresa(estado: EstadoContacto = EstadoContacto.ACTIVO): Promise<ContactoEmpresa[]> {
    return prisma.contactoEmpresa.findMany({
      where: { estado },
      include: { empresa: true, ubicacion: true },
      orderBy: { nombreCompleto: 'asc' },
    });
  }

  static async getContactoEmpresaById(id: string): Promise<ContactoEmpresa | null> {
    return prisma.contactoEmpresa.findUnique({
      where: { id },
      include: {
        empresa: true,
        ubicacion: true,
      },
    });
  }

  static async createContactoEmpresa(data: ContactoEmpresaCreateInput): Promise<ContactoEmpresa> {
    const validatedData = createContactoEmpresaSchema.parse(data);

    return prisma.$transaction(async (tx) => {
      const empresaConnect = validatedData.empresaId ? { connect: { id: validatedData.empresaId } } : undefined;
      const ubicacionConnect = validatedData.ubicacionId ? { connect: { id: validatedData.ubicacionId } } : undefined;

      return tx.contactoEmpresa.create({
        data: {
          nombreCompleto: validatedData.nombreCompleto,
          email: validatedData.email,
          telefono: validatedData.telefono,
          cargo: validatedData.cargo,
          empresa: empresaConnect,
          ubicacion: ubicacionConnect,
          // El estado por defecto es ACTIVO gracias al schema.prisma
        },
      });
    });
  }

  static async updateContactoEmpresa(data: ContactoEmpresaUpdateInput): Promise<ContactoEmpresa> {
    const validatedData = updateContactoEmpresaSchema.parse(data);
    const { id, ...updateData } = validatedData;
    
    return prisma.contactoEmpresa.update({
        where: { id },
        data: updateData
    });
  }

  /**
   * NUEVO MÉTODO: Desactiva un contacto en lugar de borrarlo.
   */
  static async deactivateContactoEmpresa(id: string): Promise<ContactoEmpresa> {
    return prisma.contactoEmpresa.update({
      where: { id },
      data: {
        estado: EstadoContacto.INACTIVO,
      },
    });
  }

  // El método deleteContactoEmpresa() ha sido eliminado intencionalmente.
}
