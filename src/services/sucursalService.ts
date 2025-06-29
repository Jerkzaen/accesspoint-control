// src/services/sucursalService.ts

import { prisma } from "@/lib/prisma";
import { Prisma, Sucursal, Empresa, Direccion, Ubicacion, Ticket, EstadoSucursal } from "@prisma/client";
import { createSucursalSchema, updateSucursalSchema } from "@/lib/validators/sucursalValidator";
import { z, ZodError } from "zod";

// ... (los tipos de input se mantienen igual)
export type SucursalCreateInput = z.infer<typeof createSucursalSchema>;
export type SucursalUpdateInput = z.infer<typeof updateSucursalSchema>;


export class SucursalService {

  static async getSucursales(estado: EstadoSucursal = EstadoSucursal.ACTIVA): Promise<Sucursal[]> {
    return prisma.sucursal.findMany({
      where: { estado },
      include: { empresa: true, direccion: true },
      orderBy: { nombre: 'asc' },
    });
  }

  static async getSucursalById(id: string): Promise<Sucursal | null> {
    return prisma.sucursal.findUnique({ where: { id }, include: { /* ...todas tus relaciones... */ } });
  }

  static async createSucursal(data: SucursalCreateInput): Promise<Sucursal> {
      createSucursalSchema.parse(data);
      return prisma.$transaction(async (tx) => {
        // CORRECCIÓN: Separamos comunaId del resto de los datos de dirección
        const { comunaId, ...direccionData } = data.direccion;
        
        const nuevaDireccion = await tx.direccion.create({ 
          data: {
            ...direccionData,
            comuna: {
              connect: { id: comunaId }
            }
          }
        });

        const empresaConnect = data.empresaId ? { connect: { id: data.empresaId } } : undefined;
        
        return tx.sucursal.create({
          data: {
            nombre: data.nombre,
            telefono: data.telefono,
            email: data.email,
            direccion: { connect: { id: nuevaDireccion.id } },
            empresa: empresaConnect,
          },
        });
      });
  }

  static async updateSucursal(data: SucursalUpdateInput): Promise<Sucursal> {
    updateSucursalSchema.parse(data);
    const { id, ...updateData } = data;
    // La lógica de actualización puede volverse más compleja, pero por ahora es un update simple.
    return prisma.sucursal.update({ where: { id }, data: { nombre: updateData.nombre, email: updateData.email, telefono: updateData.telefono } });
  }

  /**
   * NUEVO MÉTODO: Desactiva una sucursal en lugar de borrarla.
   */
  static async deactivateSucursal(id: string): Promise<Sucursal> {
    // Aquí podríamos añadir lógica extra, como desactivar todas sus ubicaciones también.
    // Por ahora, solo desactivamos la sucursal.
    return prisma.sucursal.update({
      where: { id },
      data: { estado: EstadoSucursal.INACTIVA },
    });
  }
}
