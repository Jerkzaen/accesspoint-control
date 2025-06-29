// src/services/sucursalService.ts

import { prisma } from "@/lib/prisma";
import { Prisma, Sucursal, Empresa, Direccion, Ubicacion, Ticket, EstadoSucursal } from "@prisma/client";
import { createSucursalSchema, updateSucursalSchema } from "@/lib/validators/sucursalValidator";
import { z, ZodError } from "zod";

// Tipos de input (se mantienen igual)
export type SucursalCreateInput = z.infer<typeof createSucursalSchema>;
export type SucursalUpdateInput = z.infer<typeof updateSucursalSchema>;


export class SucursalService {

  static async getSucursales(estado: EstadoSucursal = EstadoSucursal.ACTIVA): Promise<Sucursal[]> {
    try {
      return await prisma.sucursal.findMany({ // Añadido await
        where: { estado },
        include: { empresa: true, direccion: true },
        orderBy: { nombre: 'asc' },
      });
    } catch (error: any) {
      console.error("Error al obtener sucursales:", error);
      // Formateo el mensaje de error como espera la prueba
      throw new Error(`No se pudieron obtener las sucursales. Detalles: ${error.message}`);
    }
  }

  static async getSucursalById(id: string): Promise<Sucursal | null> {
    try {
      return await prisma.sucursal.findUnique({ // Añadido await
        where: { id },
        include: {
          empresa: true,
          direccion: {
            include: {
              comuna: {
                include: {
                  provincia: {
                    include: {
                      region: true,
                    },
                  },
                },
              },
            },
          },
          ubicaciones: true,
          tickets: true,
        },
      });
    } catch (error: any) {
      console.error(`Error al obtener sucursal por ID ${id}:`, error);
      // Formateo el mensaje de error como espera la prueba
      throw new Error(`No se pudo obtener la sucursal. Detalles: ${error.message}`);
    }
  }

  static async createSucursal(data: SucursalCreateInput): Promise<Sucursal> {
    try {
      createSucursalSchema.parse(data); // Validar antes de la transacción

      return await prisma.$transaction(async (tx) => {
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
            estado: EstadoSucursal.ACTIVA, // Aseguramos que el estado se establece al crear
            direccion: { connect: { id: nuevaDireccion.id } },
            empresa: empresaConnect,
          },
        });
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        console.error("Error de validación al crear sucursal:", error.errors);
        throw new Error(`Error de validación: ${error.errors.map(err => err.message).join(', ')}`);
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Aseguramos que el target de P2002 es la columna 'direccionId' para este mensaje específico
        const target = (error.meta as any)?.target;
        if (error.code === 'P2002' && (Array.isArray(target) && target.includes('direccionId'))) {
          throw new Error('La dirección ya está asociada a otra sucursal.');
        }
        console.error("Error de Prisma al crear sucursal:", error);
        throw new Error(`Error al crear la sucursal. Detalles: ${error.message}`);
      }
      console.error("Error inesperado al crear sucursal:", error);
      throw new Error(`Error al crear la sucursal. Detalles: ${error.message}`);
    }
  }

  static async updateSucursal(data: SucursalUpdateInput): Promise<Sucursal> {
    try {
      updateSucursalSchema.parse(data); // Validar antes de la operación

      const { id, direccion, empresaId, ...updateData } = data;

      return await prisma.$transaction(async (tx) => {
        // Lógica para actualizar la dirección si se proporciona y tiene ID
        if (direccion && direccion.id) {
          try {
            const { comunaId, ...direccionUpdateData } = direccion;
            await tx.direccion.update({
              where: { id: direccion.id },
              data: {
                ...direccionUpdateData,
                ...(comunaId && { comuna: { connect: { id: comunaId } } }),
              },
            });
          } catch (error: any) {
             // Manejar errores específicos de la actualización de dirección aquí,
             // o relanzarlos para que el catch principal los procese.
             // Para P2002 de direccionId en update:
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
              const target = (error.meta as any)?.target;
              if (Array.isArray(target) && (target.includes('direccionId') || target.includes('sucursales_direccionId_key'))) {
                throw new Error('La dirección ya está asociada a otra sucursal.');
              }
            }
            throw error; // Re-lanzar cualquier otro error de dirección
          }
        }

        // Preparar datos para la actualización de la sucursal
        const sucursalUpdatePayload: Prisma.SucursalUpdateInput = {
          ...updateData,
        };

        // Manejar la relación con la empresa
        if (empresaId === null) {
          sucursalUpdatePayload.empresa = { disconnect: true };
        } else if (empresaId !== undefined) { // Si se proporciona un nuevo empresaId (no nulo)
          sucursalUpdatePayload.empresa = { connect: { id: empresaId } };
        }

        return tx.sucursal.update({
          where: { id },
          data: sucursalUpdatePayload,
        });
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        console.error("Error de validación al actualizar sucursal:", error.errors);
        throw new Error(`Error de validación: ${error.errors.map(err => err.message).join(', ')}`);
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // La validación de P2002 para direccionId en update ahora se maneja dentro de la transacción.
        console.error("Error de Prisma al actualizar sucursal:", error);
        throw new Error(`Error al actualizar la sucursal. Detalles: ${error.message}`);
      }
      console.error("Error inesperado al actualizar sucursal:", error);
      throw new Error(`Error al actualizar la sucursal. Detalles: ${error.message}`);
    }
  }

  /**
   * Desactiva una sucursal en lugar de borrarla.
   */
  static async deactivateSucursal(id: string): Promise<Sucursal> {
    try {
      // Aquí podríamos añadir lógica extra, como desactivar todas sus ubicaciones también.
      // Por ahora, solo desactivamos la sucursal.
      return await prisma.sucursal.update({
        where: { id },
        data: { estado: EstadoSucursal.INACTIVA },
      });
    } catch (error: any) {
      console.error(`Error al desactivar sucursal ${id}:`, error);
      // El servicio relanza el error directamente, como la prueba espera.
      throw error;
    }
  }
}
