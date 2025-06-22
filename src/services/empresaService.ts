// src/services/empresaService.ts

import { prisma } from "@/lib/prisma";
import { Prisma, Empresa, ContactoEmpresa, Direccion, Ticket, Sucursal, EquipoInventario } from "@prisma/client";
// Importamos los esquemas de validación Zod para Empresa
import { empresaSchema, createEmpresaSchema, updateEmpresaSchema } from "@/lib/validators/empresaValidator"; 

/**
 * Define los tipos de entrada para las operaciones CRUD de Empresa.
 * Estos tipos deben coincidir con lo que esperan tus esquemas Zod y Prisma.
 */
export type EmpresaCreateInput = {
  nombre: string;
  rut: string;
  logoUrl?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccionPrincipal?: {
    calle: string;
    numero: string;
    depto?: string | null;
    comunaId: string;
  };
};

export type EmpresaUpdateInput = {
  id?: string; // El ID de la empresa es para la ruta, no el payload de actualización necesariamente
  nombre?: string;
  rut?: string;
  logoUrl?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccionPrincipal?: {
    id?: string; // Para actualizar o crear una nueva dirección principal
    calle?: string;
    numero?: string;
    depto?: string | null;
    comunaId?: string;
  } | null; // Permitir que direccionPrincipal sea null para desvincular
};


/**
 * Tipo para una Empresa con sus relaciones más comunes, haciendo las relaciones opcionales
 * para reflejar con precisión lo que Prisma podría devolver si no se incluyen.
 */
export type EmpresaWithRelations = Empresa & {
  direccionPrincipal?: Direccion | null; // Puede ser null si no tiene dirección principal
  contactos?: ContactoEmpresa[]; // Array opcional si no se incluye
  sucursales?: Sucursal[]; // Array opcional
  tickets?: Ticket[]; // Array opcional
  equiposInventario?: EquipoInventario[]; // Array opcional
};


/**
 * Servicio para la gestión de Empresas y Contactos de Empresa.
 * Centraliza la lógica de negocio y el acceso a la base de datos para estas entidades.
 */
export class EmpresaService {

  /**
   * Obtiene todas las empresas, opcionalmente incluyendo su dirección principal.
   * @param includeDirection Indica si se debe incluir la dirección principal.
   * @returns Un array de objetos Empresa o EmpresaWithRelations.
   */
  static async getEmpresas(includeDirection: boolean = false): Promise<Empresa[]> {
    try {
      const empresas = await prisma.empresa.findMany({
        include: {
          direccionPrincipal: includeDirection,
        },
        orderBy: { nombre: 'asc' },
      });
      return empresas;
    } catch (error) {
      console.error("Error al obtener empresas en EmpresaService:", error);
      throw new Error("No se pudieron obtener las empresas.");
    }
  }

  /**
   * Obtiene una empresa por su ID, incluyendo todas sus relaciones relevantes.
   * @param id El ID de la empresa.
   * @returns El objeto EmpresaWithRelations o null si no se encuentra.
   */
  static async getEmpresaById(id: string): Promise<EmpresaWithRelations | null> {
    try {
      const empresa = await prisma.empresa.findUnique({
        where: { id },
        include: {
          direccionPrincipal: true,
          contactos: true,
          sucursales: true,
          tickets: true,
          equiposInventario: true, // Incluir equipos si es necesario para el uso de este tipo
        },
      });
      return empresa;
    } catch (error) {
      console.error(`Error al obtener empresa con ID ${id} en EmpresaService:`, error);
      throw new Error("No se pudo obtener la empresa.");
    }
  }

  /**
   * Crea una nueva empresa, incluyendo opcionalmente su dirección principal.
   * Utiliza una transacción para asegurar que ambas operaciones sean atómicas.
   * Valida los datos de entrada con Zod.
   * @param data Los datos para crear la empresa y su dirección principal.
   * @returns El objeto Empresa creado.
   */
  static async createEmpresa(data: EmpresaCreateInput): Promise<Empresa> {
    // Validar los datos de entrada con el esquema de creación de Zod
    // Esto asegura que los datos sean válidos antes de la interacción con la DB.
    try {
      const validatedData = createEmpresaSchema.parse(data);

      const newEmpresa = await prisma.$transaction(async (tx) => {
        let direccionId: string | null = null; 

        // Si se proporciona una dirección principal, la creamos primero
        if (validatedData.direccionPrincipal) {
          const nuevaDireccion = await tx.direccion.create({
            data: {
              calle: validatedData.direccionPrincipal.calle,
              numero: validatedData.direccionPrincipal.numero,
              depto: validatedData.direccionPrincipal.depto,
              comuna: { connect: { id: validatedData.direccionPrincipal.comunaId } },
            },
          });
          direccionId = nuevaDireccion.id;
        }

        // Creamos la empresa
        const empresa = await tx.empresa.create({
          data: {
            nombre: validatedData.nombre,
            rut: validatedData.rut,
            logoUrl: validatedData.logoUrl,
            telefono: validatedData.telefono,
            email: validatedData.email,
            direccionPrincipal: direccionId ? { connect: { id: direccionId } } : undefined,
          },
        });
        return empresa;
      });
      return newEmpresa;
    } catch (error) {
      console.error("Error al crear empresa en EmpresaService:", error);
      // Retorna el mensaje de error de Zod si es una excepción de validación
      if (error instanceof Error && 'issues' in error) { // ZodError
        throw new Error("Error de validación al crear empresa: " + (error as any).issues.map((i: any) => i.message).join(", "));
      }
      // Manejo de errores de Prisma, por ejemplo, para duplicados
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error("El RUT de la empresa ya existe.");
        }
      }
      throw new Error("Error al crear la empresa. Detalles: " + (error as Error).message);
    }
  }

  /**
   * Actualiza una empresa existente, incluyendo opcionalmente su dirección principal.
   * Utiliza una transacción para asegurar que todas las operaciones sean atómicas.
   * Valida los datos de entrada con Zod.
   * @param id El ID de la empresa a actualizar.
   * @param data Los datos para actualizar la empresa y su dirección principal.
   * @returns El objeto Empresa actualizado.
   */
  static async updateEmpresa(id: string, data: EmpresaUpdateInput): Promise<Empresa> {
    // Validar los datos de entrada con el esquema de actualización de Zod
    // Esto asegura que los datos sean válidos antes de la interacción con la DB.
    try {
      const validatedData = updateEmpresaSchema.parse(data);

      const updatedEmpresa = await prisma.$transaction(async (tx) => {
        let direccionPrincipalIdToUpdate: string | null | undefined; 

        // Lógica para actualizar, crear o desvincular la dirección principal si se proporciona
        if (validatedData.direccionPrincipal !== undefined) {
          if (validatedData.direccionPrincipal === null) {
            direccionPrincipalIdToUpdate = null; // Para desvincular la relación
          } else {
            const { id: dirId, ...dirData } = validatedData.direccionPrincipal;
            if (dirId) {
              // Si la dirección ya existe y se envía su ID, la actualizamos
              await tx.direccion.update({
                where: { id: dirId },
                data: {
                  calle: dirData.calle,
                  numero: dirData.numero,
                  depto: dirData.depto,
                  comuna: dirData.comunaId ? { connect: { id: dirData.comunaId } } : undefined,
                },
              });
              direccionPrincipalIdToUpdate = dirId;
            } else if (dirData.calle && dirData.numero && dirData.comunaId) {
              // Si no hay ID de dirección, pero hay datos completos, creamos una nueva
              const nuevaDireccion = await tx.direccion.create({
                data: {
                  calle: dirData.calle,
                  numero: dirData.numero,
                  depto: dirData.depto,
                  comuna: { connect: { id: dirData.comunaId } },
                },
              });
              direccionPrincipalIdToUpdate = nuevaDireccion.id;
            } else {
              // Si la dirección principal es un objeto pero no tiene ID ni datos completos,
              // mantenemos el direccionPrincipalId existente.
              const currentEmpresa = await tx.empresa.findUnique({
                where: { id },
                select: { direccionPrincipalId: true }
              });
              direccionPrincipalIdToUpdate = currentEmpresa?.direccionPrincipalId;
            }
          }
        } else {
          // Si validatedData.direccionPrincipal no se envió, no modificamos el direccionPrincipalId
          const currentEmpresa = await tx.empresa.findUnique({
            where: { id },
            select: { direccionPrincipalId: true }
          });
          direccionPrincipalIdToUpdate = currentEmpresa?.direccionPrincipalId;
        }

        // Preparamos los datos de la empresa para la actualización
        const empresaUpdateData: Prisma.EmpresaUpdateInput = {
          nombre: validatedData.nombre,
          rut: validatedData.rut,
          logoUrl: validatedData.logoUrl,
          telefono: validatedData.telefono,
          email: validatedData.email,
        };

        // Si la propiedad direccionPrincipal se envió (incluso como null),
        // entonces asignamos direccionPrincipalIdToUpdate.
        if (validatedData.direccionPrincipal !== undefined) {
          empresaUpdateData.direccionPrincipal = direccionPrincipalIdToUpdate === null
            ? { disconnect: true } // Desvincular si se quiere null
            : direccionPrincipalIdToUpdate !== undefined
              ? { connect: { id: direccionPrincipalIdToUpdate } } // Conectar si hay un ID válido
              : undefined; // No hacer nada si es undefined (no cambia)
        }

        // Actualizamos la empresa
        const empresa = await tx.empresa.update({
          where: { id },
          data: empresaUpdateData,
        });
        return empresa;
      });
      return updatedEmpresa;
    } catch (error) {
      console.error(`Error al actualizar empresa con ID ${id} en EmpresaService:`, error);
      // Retorna el mensaje de error de Zod si es una excepción de validación
      if (error instanceof Error && 'issues' in error) { // ZodError
        throw new Error("Error de validación al actualizar empresa: " + (error as any).issues.map((i: any) => i.message).join(", "));
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error("El RUT de la empresa ya existe.");
        }
      }
      throw new Error("Error al actualizar la empresa. Detalles: " + (error as Error).message);
    }
  }

  /**
   * Elimina una empresa.
   * Antes de eliminar, verifica si existen sucursales o tickets asociados.
   * Si existen, la eliminación es restringida para mantener la integridad.
   * @param id El ID de la empresa a eliminar.
   * @returns Un objeto de éxito o error.
   */
  static async deleteEmpresa(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      await prisma.$transaction(async (tx) => {
        // Verificar si la empresa tiene sucursales activas (onDelete: Restrict en Sucursal)
        const sucursalesCount = await tx.sucursal.count({
          where: { empresaId: id },
        });

        if (sucursalesCount > 0) {
          throw new Error("No se puede eliminar la empresa porque tiene sucursales asociadas. Primero, desvincula o elimina sus sucursales.");
        }

        // Verificar si la empresa tiene tickets asociados (onDelete: SET NULL en Ticket)
        const ticketsCount = await tx.ticket.count({
          where: { empresaId: id },
        });

        if (ticketsCount > 0) {
          throw new Error("No se puede eliminar la empresa porque tiene tickets asociados. Por favor, reasigna o cierra los tickets de esta empresa primero.");
        }

        // Eliminar contactos asociados a la empresa (onDelete: Cascade en ContactoEmpresa lo maneja)
        await tx.contactoEmpresa.deleteMany({
          where: { empresaId: id },
        });

        // Desvincular la dirección principal si existe
        await tx.empresa.update({
          where: { id },
          data: {
            direccionPrincipalId: null // Correcta forma de desvincular una relación opcional 1:1
          }
        });

        // Finalmente, eliminar la empresa
        await tx.empresa.delete({
          where: { id },
        });
      });
      return { success: true, message: "Empresa eliminada exitosamente." };
    } catch (error: any) {
      console.error(`Error al eliminar empresa con ID ${id} en EmpresaService:`, error);
      return { success: false, message: error.message || "Error al eliminar la empresa." };
    }
  }
}
