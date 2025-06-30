// src/services/equipoInventarioService.ts

import { prisma } from "@/lib/prisma";
import { EquipoInventario, EstadoEquipoInventario, TipoEquipoInventario, Prisma } from "@prisma/client";
import { ZodError, z } from "zod";

// Importar los tipos de input de la fase 2 (validadores)
// ESTA ES LA CORRECCIÓN CLAVE: Nos aseguramos de importar estos tipos desde el validador,
// y eliminamos las definiciones duplicadas dentro de este archivo.
import {
  EquipoInventarioCreateInput,
  EquipoInventarioUpdateInput,
  createEquipoInventarioSchema, // Importamos también el esquema si se usa para validación interna
  updateEquipoInventarioSchema, // Importamos también el esquema si se usa para validación interna
} from "@/lib/validators/equipoInventarioValidator";

// Re-exportar los tipos para que puedan ser usados por otros módulos
export type { EquipoInventarioCreateInput, EquipoInventarioUpdateInput };

// Tipo que incluye todas las relaciones para el getEquipoById
type EquipoInventarioWithRelations = Prisma.EquipoInventarioGetPayload<{
  include: {
    ubicacionActual: true;
    empresa: true;
    parentEquipo: true;
    componentes: true;
    prestamos: true;
  };
}>;


export class EquipoInventarioService {

  /**
   * Obtiene una lista de equipos, opcionalmente filtrados por estado.
   * Incluye relaciones relevantes.
   */
  static async getEquipos(estado?: EstadoEquipoInventario): Promise<EquipoInventario[]> {
    try {
      const whereClause = estado ? { estadoEquipo: estado } : {};
      return await prisma.equipoInventario.findMany({
        where: whereClause,
        include: {
          ubicacionActual: true,
          empresa: true,
          parentEquipo: true, // Relación con el equipo padre
          componentes: true,  // Relación con los componentes hijos (cuidado con anidaciones profundas)
          prestamos: true, // Incluir préstamos asociados
        },
        orderBy: { nombreDescriptivo: 'asc' },
      });
    } catch (error: any) {
      console.error("Error al obtener equipos:", error);
      throw new Error(`No se pudieron obtener los equipos. Detalles: ${error.message}`);
    }
  }

  /**
   * Obtiene un equipo específico por su ID, incluyendo todas sus relaciones importantes.
   */
  static async getEquipoById(id: string): Promise<EquipoInventarioWithRelations | null> {
    try {
      return await prisma.equipoInventario.findUnique({
        where: { id },
        include: {
          ubicacionActual: true,
          empresa: true,
          parentEquipo: true,
          componentes: true,
          prestamos: true, // Incluir préstamos asociados si es relevante
        },
      });
    } catch (error: any) {
      console.error(`Error al obtener equipo por ID ${id}:`, error);
      throw new Error(`No se pudo obtener el equipo. Detalles: ${error.message}`);
    }
  }

  /**
   * Crea un nuevo equipo en el inventario.
   */
  static async createEquipo(data: EquipoInventarioCreateInput): Promise<EquipoInventario> {
    try {
      // Validar los datos de entrada con el esquema de creación de Zod
      // Se utiliza una aserción de tipo para asegurar que `validatedData` tiene el tipo completo.
      const validatedData = createEquipoInventarioSchema.parse(data) as EquipoInventarioCreateInput;

      // Manejo de relaciones anidadas si los IDs están presentes
      const connectData: Prisma.EquipoInventarioCreateInput = {
        nombreDescriptivo: validatedData.nombreDescriptivo,
        identificadorUnico: validatedData.identificadorUnico,
        tipoEquipo: validatedData.tipoEquipo,
        estadoEquipo: validatedData.estadoEquipo || EstadoEquipoInventario.DISPONIBLE, // Por defecto DISPONIBLE
        marca: validatedData.marca,
        modelo: validatedData.modelo,
        descripcionAdicional: validatedData.descripcionAdicional,
        fechaAdquisicion: validatedData.fechaAdquisicion,
        proveedor: validatedData.proveedor,
        notasGenerales: validatedData.notasGenerales,
        panelVtsSerie: validatedData.panelVtsSerie,
        pedalVtsSerie: validatedData.pedalVtsSerie,
        biarticTipoDispositivo: validatedData.biarticTipoDispositivo,
        
        // Conexiones de relaciones (solo si el ID está presente y no es null)
        ...(validatedData.ubicacionActualId && { ubicacionActual: { connect: { id: validatedData.ubicacionActualId } } }),
        ...(validatedData.empresaId && { empresa: { connect: { id: validatedData.empresaId } } }),
        ...(validatedData.parentEquipoId && { parentEquipo: { connect: { id: validatedData.parentEquipoId } } }),
      };

      return await prisma.equipoInventario.create({ data: connectData });
    } catch (error: any) {
      console.error("Error al crear equipo:", error);
      if (error instanceof ZodError) {
        throw new Error("Error de validación al crear equipo: " + error.errors.map(e => e.message).join(", "));
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta as any)?.target;
        if (Array.isArray(target) && target.includes('identificadorUnico')) {
          throw new Error('Ya existe un equipo con este identificador único.');
        }
      }
      throw new Error(`No se pudo crear el equipo. Detalles: ${error.message}`);
    }
  }

  /**
   * Actualiza un equipo existente en el inventario.
   */
  static async updateEquipo(id: string, data: EquipoInventarioUpdateInput): Promise<EquipoInventario> {
    try {
      // Validar los datos de entrada con el esquema de actualización de Zod
      // Se utiliza una aserción de tipo para asegurar que `validatedData` tiene el tipo completo.
      const validatedData = updateEquipoInventarioSchema.parse(data) as EquipoInventarioUpdateInput;

      const updateData: Prisma.EquipoInventarioUpdateInput = {
        nombreDescriptivo: validatedData.nombreDescriptivo,
        identificadorUnico: validatedData.identificadorUnico,
        tipoEquipo: validatedData.tipoEquipo,
        estadoEquipo: validatedData.estadoEquipo,
        marca: validatedData.marca,
        modelo: validatedData.modelo,
        descripcionAdicional: validatedData.descripcionAdicional,
        fechaAdquisicion: validatedData.fechaAdquisicion,
        proveedor: validatedData.proveedor,
        notasGenerales: validatedData.notasGenerales,
        panelVtsSerie: validatedData.panelVtsSerie,
        pedalVtsSerie: validatedData.pedalVtsSerie,
        biarticTipoDispositivo: validatedData.biarticTipoDispositivo,
      };

      // Manejo de conexiones/desconexiones para relaciones opcionales (si son undefined, no se tocan; si son null, se desconectan)
      if (validatedData.ubicacionActualId !== undefined) {
        updateData.ubicacionActual = validatedData.ubicacionActualId === null ? { disconnect: true } : { connect: { id: validatedData.ubicacionActualId } };
      }
      if (validatedData.empresaId !== undefined) {
        updateData.empresa = validatedData.empresaId === null ? { disconnect: true } : { connect: { id: validatedData.empresaId } };
      }
      if (validatedData.parentEquipoId !== undefined) {
        updateData.parentEquipo = validatedData.parentEquipoId === null ? { disconnect: true } : { connect: { id: validatedData.parentEquipoId } };
      }
      
      return await prisma.equipoInventario.update({
        where: { id },
        data: updateData,
      });
    } catch (error: any) {
      console.error(`Error al actualizar equipo ${id}:`, error);
      if (error instanceof ZodError) {
        throw new Error("Error de validación al actualizar equipo: " + error.errors.map(e => e.message).join(", "));
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') { // Unique constraint failed (e.g., on identificadorUnico)
          throw new Error("El identificador único ya existe.");
        }
        if (error.code === 'P2025') { // Record not found
          throw new Error('Equipo no encontrado para actualizar.');
        }
      }
      throw new Error(`No se pudo actualizar el equipo. Detalles: ${error.message}`);
    }
  }

  /**
   * Desactiva un equipo cambiando su estado a 'DE_BAJA'.
   * Reglas de negocio: Si el equipo está PRESTADO, no se debería poder desactivar.
   * Si tiene componentes hijos, podríamos considerar reglas adicionales (ej. desactivar hijos primero).
   */
  static async deactivateEquipo(id: string): Promise<EquipoInventario> {
    try {
      // Opcional: Cargar el equipo para verificar su estado actual (ej. si está PRESTADO)
      const equipo = await prisma.equipoInventario.findUnique({ where: { id } });
      if (!equipo) {
        throw new Error('Equipo no encontrado para desactivar.');
      }
      if (equipo.estadoEquipo === EstadoEquipoInventario.PRESTADO) {
        throw new Error('No se puede dar de baja un equipo que está prestado.');
      }
      // Aquí se podría añadir lógica para verificar si tiene hijos activos, etc.

      return await prisma.equipoInventario.update({
        where: { id },
        data: { estadoEquipo: EstadoEquipoInventario.DE_BAJA },
      });
    } catch (error: any) {
      console.error(`Error al desactivar equipo ${id}:`, error);
      // PrismaClientKnownRequestError P2003 (Foreign key constraint failed)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new Error('No se puede desactivar el equipo debido a elementos asociados (préstamos, tickets).');
      }
      throw error; // Relanzar el error original o uno genérico
    }
  }

  // --- Lógica Adicional (Consideraciones Avanzadas) ---

  /**
   * Asigna un componente a un equipo padre (establece parentEquipoId).
   */
  static async addComponent(parentId: string, componentId: string): Promise<EquipoInventario> {
    try {
      // Validar que ambos equipos existen y son compatibles para composición.
      // Validar que el componente no es ya padre de otro equipo.
      return await prisma.equipoInventario.update({
        where: { id: componentId },
        data: {
          parentEquipo: { connect: { id: parentId } },
        },
      });
    } catch (error: any) {
      console.error(`Error al añadir componente ${componentId} al padre ${parentId}:`, error);
      throw new Error(`No se pudo añadir el componente. Detalles: ${error.message}`);
    }
  }

  /**
   * Remueve un componente de un equipo padre (establece parentEquipoId a null).
   */
  static async removeComponent(parentId: string, componentId: string): Promise<EquipoInventario> {
    try {
      // Validar que el componente realmente es hijo del padre especificado.
      return await prisma.equipoInventario.update({
        where: { id: componentId },
        data: {
          parentEquipo: { disconnect: true },
        },
      });
    } catch (error: any) {
      console.error(`Error al remover componente ${componentId} del padre ${parentId}:`, error);
      throw new Error(`No se pudo remover el componente. Detalles: ${error.message}`);
    }
  }

  /**
   * Cambia el estado de un equipo.
   */
  static async changeEquipoEstado(id: string, nuevoEstado: EstadoEquipoInventario): Promise<EquipoInventario> {
    try {
      return await prisma.equipoInventario.update({
        where: { id },
        data: { estadoEquipo: nuevoEstado },
      });
    } catch (error: any) {
      console.error(`Error al cambiar estado del equipo ${id} a ${nuevoEstado}:`, error);
      throw new Error(`No se pudo cambiar el estado del equipo. Detalles: ${error.message}`);
    }
  }
}
