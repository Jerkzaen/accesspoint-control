// src/services/contactoEmpresaService.ts

import { prisma } from "@/lib/prisma";
import { Prisma, ContactoEmpresa, Empresa, Ubicacion } from "@prisma/client";
// Importamos los esquemas de validación Zod para ContactoEmpresa
import { createContactoEmpresaSchema, updateContactoEmpresaSchema } from "@/lib/validators/contactoEmpresaValidator";

/**
 * Define los tipos de entrada para las operaciones CRUD de ContactoEmpresa.
 */
export type ContactoEmpresaCreateInput = {
  nombreCompleto: string;
  email: string;
  telefono: string;
  cargo?: string | null;
  empresaId?: string | null;
  ubicacionId?: string | null;
};

export type ContactoEmpresaUpdateInput = {
  id: string; // El ID del contacto a actualizar
  nombreCompleto?: string;
  email?: string;
  telefono?: string;
  cargo?: string | null;
  empresaId?: string | null; // Puede ser null para desvincular
  ubicacionId?: string | null; // Puede ser null para desvincular
};

/**
 * Tipo para un ContactoEmpresa con sus relaciones más comunes.
 */
export type ContactoEmpresaWithRelations = ContactoEmpresa & {
  empresa?: Empresa | null;
  ubicacion?: Ubicacion | null;
};

/**
 * Servicio para la gestión de Contactos de Empresa.
 * Centraliza la lógica de negocio y el acceso a la base de datos para los contactos.
 */
export class ContactoEmpresaService {

  /**
   * Obtiene todos los contactos de empresa, opcionalmente incluyendo sus relaciones.
   * @param includeRelations Indica si se deben incluir las relaciones de empresa y ubicación.
   * @returns Un array de objetos ContactoEmpresa o ContactoEmpresaWithRelations.
   */
  static async getContactosEmpresa(includeRelations: boolean = false): Promise<ContactoEmpresa[]> {
    try {
      const contactos = await prisma.contactoEmpresa.findMany({
        include: includeRelations ? {
          empresa: true,
          ubicacion: true,
        } : undefined,
        orderBy: { nombreCompleto: 'asc' },
      });
      return contactos;
    } catch (error) {
      console.error("Error al obtener contactos de empresa en ContactoEmpresaService:", error);
      throw new Error("No se pudieron obtener los contactos de empresa.");
    }
  }

  /**
   * Obtiene un contacto de empresa por su ID, incluyendo sus relaciones.
   * @param id El ID del contacto.
   * @returns El objeto ContactoEmpresaWithRelations o null si no se encuentra.
   */
  static async getContactoEmpresaById(id: string): Promise<ContactoEmpresaWithRelations | null> {
    try {
      const contacto = await prisma.contactoEmpresa.findUnique({
        where: { id },
        include: {
          empresa: true,
          ubicacion: true,
        },
      });
      return contacto;
    } catch (error) {
      console.error(`Error al obtener contacto de empresa con ID ${id} en ContactoEmpresaService:`, error);
      throw new Error("No se pudo obtener el contacto de empresa.");
    }
  }

  /**
   * Crea un nuevo contacto de empresa, validando los datos con Zod.
   * @param data Los datos para crear el contacto.
   * @returns El objeto ContactoEmpresa creado.
   */
  static async createContactoEmpresa(data: ContactoEmpresaCreateInput): Promise<ContactoEmpresa> {
    try {
      // Validar los datos de entrada con el esquema de creación de Zod
      const validatedData = createContactoEmpresaSchema.parse(data);

      const newContacto = await prisma.$transaction(async (tx) => {
        // Preparar datos de conexión para relaciones opcionales
        const empresaConnect = validatedData.empresaId ? { connect: { id: validatedData.empresaId } } : undefined;
        const ubicacionConnect = validatedData.ubicacionId ? { connect: { id: validatedData.ubicacionId } } : undefined;

        const contacto = await tx.contactoEmpresa.create({
          data: {
            nombreCompleto: validatedData.nombreCompleto,
            email: validatedData.email,
            telefono: validatedData.telefono,
            cargo: validatedData.cargo,
            empresa: empresaConnect,
            ubicacion: ubicacionConnect,
          },
        });
        return contacto;
      });
      return newContacto;
    } catch (error) {
      console.error("Error al crear contacto de empresa en ContactoEmpresaService:", error);
      if (error instanceof Error && 'issues' in error) { // ZodError
        throw new Error("Error de validación al crear contacto: " + (error as any).issues.map((i: any) => i.message).join(", "));
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') { // Unique constraint failed (e.g., on email)
          throw new Error("Error al crear contacto: El correo electrónico ya existe.");
        }
      }
      throw new Error("Error al crear el contacto de empresa. Detalles: " + (error as Error).message);
    }
  }

  /**
   * Actualiza un contacto de empresa existente, validando los datos con Zod.
   * @param data Los datos para actualizar el contacto (incluyendo el ID).
   * @returns El objeto ContactoEmpresa actualizado.
   */
  static async updateContactoEmpresa(data: ContactoEmpresaUpdateInput): Promise<ContactoEmpresa> {
    try {
      // Validar los datos de entrada con el esquema de actualización de Zod
      const validatedData = updateContactoEmpresaSchema.parse(data);

      const updatedContacto = await prisma.$transaction(async (tx) => {
        // Preparar datos de conexión/desconexión para relaciones opcionales
        const empresaUpdate = validatedData.empresaId !== undefined
          ? (validatedData.empresaId === null ? { disconnect: true } : { connect: { id: validatedData.empresaId } })
          : undefined;
        const ubicacionUpdate = validatedData.ubicacionId !== undefined
          ? (validatedData.ubicacionId === null ? { disconnect: true } : { connect: { id: validatedData.ubicacionId } })
          : undefined;

        const contacto = await tx.contactoEmpresa.update({
          where: { id: validatedData.id },
          data: {
            nombreCompleto: validatedData.nombreCompleto,
            email: validatedData.email,
            telefono: validatedData.telefono,
            cargo: validatedData.cargo,
            empresa: empresaUpdate,
            ubicacion: ubicacionUpdate,
          },
        });
        return contacto;
      });
      return updatedContacto;
    } catch (error) {
      console.error(`Error al actualizar contacto de empresa con ID ${data.id} en ContactoEmpresaService:`, error);
      if (error instanceof Error && 'issues' in error) { // ZodError
        throw new Error("Error de validación al actualizar contacto: " + (error as any).issues.map((i: any) => i.message).join(", "));
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') { // Unique constraint failed (e.g., on email)
          throw new Error("Error al actualizar contacto: El correo electrónico ya existe.");
        }
      }
      throw new Error("Error al actualizar el contacto de empresa. Detalles: " + (error as Error).message);
    }
  }

  /**
   * Elimina un contacto de empresa.
   * @param id El ID del contacto a eliminar.
   * @returns Un objeto de éxito o error.
   */
  static async deleteContactoEmpresa(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      await prisma.$transaction(async (tx) => {
        // Antes de eliminar el contacto, verificar si está asociado a algún EquipoEnPrestamo
        const prestamosCount = await tx.equipoEnPrestamo.count({
          where: { prestadoAContactoId: id },
        });

        if (prestamosCount > 0) {
          throw new Error("No se puede eliminar el contacto porque tiene equipos prestados asociados. Por favor, asegúrate de que todos los préstamos relacionados hayan sido devueltos o reasignados.");
        }

        // Antes de eliminar el contacto, verificar si está asociado a algún Ticket como solicitante
        const ticketsCount = await tx.ticket.count({
          where: { contactoId: id },
        });

        if (ticketsCount > 0) {
          // Si hay tickets, se podría reasignar el contacto a null en esos tickets
          // Por ahora, lanzamos un error para forzar la reasignación o decisión.
          throw new Error("No se puede eliminar el contacto porque tiene tickets asociados. Por favor, reasigna los tickets de este contacto primero.");
        }

        // Eliminar el contacto
        await tx.contactoEmpresa.delete({
          where: { id },
        });
      });
      return { success: true, message: "Contacto de empresa eliminado exitosamente." };
    } catch (error: any) {
      console.error(`Error al eliminar contacto de empresa con ID ${id} en ContactoEmpresaService:`, error);
      return { success: false, message: error.message || "Error al eliminar el contacto de empresa." };
    }
  }
}
