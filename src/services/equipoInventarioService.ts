    // src/services/equipoInventarioService.ts

    import { prisma } from "@/lib/prisma";
    import { Prisma, EquipoInventario, Ubicacion, Empresa, EquipoEnPrestamo, EstadoEquipoInventario } from "@prisma/client";
    // Importamos los esquemas de validación Zod para EquipoInventario
    import { createEquipoInventarioSchema, updateEquipoInventarioSchema } from "@/lib/validators/equipoInventarioValidator";
    import { ZodError } from "zod"; // Importar ZodError

    /**
     * Define los tipos de entrada para las operaciones CRUD de EquipoInventario.
     */
    export type EquipoInventarioCreateInput = {
      nombreDescriptivo: string;
      identificadorUnico: string;
      tipoEquipo: string; // Se validará con enum en Zod
      marca?: string | null;
      modelo?: string | null;
      descripcionAdicional?: string | null;
      estadoEquipo?: EstadoEquipoInventario; // Se validará con enum en Zod
      fechaAdquisicion?: Date | null;
      proveedor?: string | null;
      ubicacionActualId?: string | null;
      notasGenerales?: string | null;
      panelVtsSerie?: string | null;
      pedalVtsSerie?: string | null;
      biarticTipoDispositivo?: string | null;
      empresaId?: string | null;
    };

    export type EquipoInventarioUpdateInput = {
      id: string; // ID del equipo a actualizar
      nombreDescriptivo?: string;
      identificadorUnico?: string;
      tipoEquipo?: string;
      marca?: string | null;
      modelo?: string | null;
      descripcionAdicional?: string | null;
      estadoEquipo?: EstadoEquipoInventario;
      fechaAdquisicion?: Date | null;
      proveedor?: string | null;
      ubicacionActualId?: string | null;
      notasGenerales?: string | null;
      panelVtsSerie?: string | null;
      pedalVtsSerie?: string | null;
      biarticTipoDispositivo?: string | null;
      empresaId?: string | null;
    };

    /**
     * Tipo para un EquipoInventario con sus relaciones más comunes.
     */
    export type EquipoInventarioWithRelations = EquipoInventario & {
      ubicacionActual?: Ubicacion | null;
      empresa?: Empresa | null;
      prestamos?: EquipoEnPrestamo[];
    };

    /**
     * Servicio para la gestión de EquipoInventario.
     * Centraliza la lógica de negocio y el acceso a la base de datos para los equipos.
     */
    export class EquipoInventarioService {

      /**
       * Obtiene todos los equipos en inventario, opcionalmente incluyendo sus relaciones.
       * @param includeRelations Indica si se deben incluir las relaciones de ubicación actual y empresa.
       * @returns Un array de objetos EquipoInventario o EquipoInventarioWithRelations.
       */
      static async getEquiposInventario(includeRelations: boolean = false): Promise<EquipoInventario[]> {
        try {
          const equipos = await prisma.equipoInventario.findMany({
            include: includeRelations ? {
              ubicacionActual: true,
              empresa: true,
              prestamos: true, // Se pueden incluir los préstamos si es necesario en la lista
            } : undefined,
            orderBy: { nombreDescriptivo: 'asc' },
          });
          return equipos;
        } catch (error) {
          console.error("Error al obtener equipos de inventario en EquipoInventarioService:", error);
          throw new Error("No se pudieron obtener los equipos de inventario.");
        }
      }

      /**
       * Obtiene un equipo de inventario por su ID, incluyendo sus relaciones.
       * @param id El ID del equipo.
       * @returns El objeto EquipoInventarioWithRelations o null si no se encuentra.
       */
      static async getEquipoInventarioById(id: string): Promise<EquipoInventarioWithRelations | null> {
        try {
          const equipo = await prisma.equipoInventario.findUnique({
            where: { id },
            include: {
              ubicacionActual: true,
              empresa: true,
              prestamos: { // Siempre incluir préstamos para el detalle del equipo
                orderBy: { fechaPrestamo: 'desc' }
              },
            },
          });
          return equipo;
        } catch (error) {
          console.error(`Error al obtener equipo de inventario con ID ${id} en EquipoInventarioService:`, error);
          throw new Error("No se pudo obtener el equipo de inventario.");
        }
      }

      /**
       * Crea un nuevo equipo de inventario, validando los datos con Zod.
       * @param data Los datos para crear el equipo.
       * @returns El objeto EquipoInventario creado.
       */
      static async createEquipoInventario(data: EquipoInventarioCreateInput): Promise<EquipoInventario> {
        try {
          // Validar los datos de entrada con el esquema de creación de Zod
          const validatedData = createEquipoInventarioSchema.parse(data);

          const newEquipo = await prisma.$transaction(async (tx) => {
            // Preparar datos de conexión para relaciones opcionales
            const ubicacionActualConnect = validatedData.ubicacionActualId ? { connect: { id: validatedData.ubicacionActualId } } : undefined;
            const empresaConnect = validatedData.empresaId ? { connect: { id: validatedData.empresaId } } : undefined;

            const equipo = await tx.equipoInventario.create({
              data: {
                nombreDescriptivo: validatedData.nombreDescriptivo,
                identificadorUnico: validatedData.identificadorUnico,
                tipoEquipo: validatedData.tipoEquipo,
                marca: validatedData.marca,
                modelo: validatedData.modelo,
                descripcionAdicional: validatedData.descripcionAdicional,
                estadoEquipo: validatedData.estadoEquipo,
                fechaAdquisicion: validatedData.fechaAdquisicion,
                proveedor: validatedData.proveedor,
                ubicacionActual: ubicacionActualConnect,
                notasGenerales: validatedData.notasGenerales,
                panelVtsSerie: validatedData.panelVtsSerie,
                pedalVtsSerie: validatedData.pedalVtsSerie,
                biarticTipoDispositivo: validatedData.biarticTipoDispositivo,
                empresa: empresaConnect,
              },
            });
            return equipo;
          });
          return newEquipo;
        } catch (error) {
          if (error instanceof ZodError) { // Importar ZodError
            throw new Error("Error de validación al crear equipo: " + error.errors.map(e => e.message).join(", "));
          }
          console.error("Error al crear equipo de inventario en EquipoInventarioService:", error);
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') { // Unique constraint failed (e.g., on identificadorUnico)
              throw new Error("El identificador único ya existe.");
            }
          }
          throw new Error("Error al crear el equipo de inventario. Detalles: " + (error as Error).message);
        }
      }

      /**
       * Actualiza un equipo de inventario existente, validando los datos con Zod.
       * @param data Los datos para actualizar el equipo (incluyendo el ID).
       * @returns El objeto EquipoInventario actualizado.
       */
      static async updateEquipoInventario(data: EquipoInventarioUpdateInput): Promise<EquipoInventario> {
        try {
          // Validar los datos de entrada con el esquema de actualización de Zod
          const validatedData = updateEquipoInventarioSchema.parse(data);

          const updatedEquipo = await prisma.$transaction(async (tx) => {
            // Preparar datos de conexión/desconexión para relaciones opcionales
            const ubicacionActualUpdate = validatedData.ubicacionActualId !== undefined
              ? (validatedData.ubicacionActualId === null ? { disconnect: true } : { connect: { id: validatedData.ubicacionActualId } })
              : undefined;
            const empresaUpdate = validatedData.empresaId !== undefined
              ? (validatedData.empresaId === null ? { disconnect: true } : { connect: { id: validatedData.empresaId } })
              : undefined;

            const equipo = await tx.equipoInventario.update({
              where: { id: validatedData.id },
              data: {
                nombreDescriptivo: validatedData.nombreDescriptivo,
                identificadorUnico: validatedData.identificadorUnico,
                tipoEquipo: validatedData.tipoEquipo,
                marca: validatedData.marca,
                modelo: validatedData.modelo,
                descripcionAdicional: validatedData.descripcionAdicional,
                estadoEquipo: validatedData.estadoEquipo,
                fechaAdquisicion: validatedData.fechaAdquisicion,
                proveedor: validatedData.proveedor,
                ubicacionActual: ubicacionActualUpdate,
                notasGenerales: validatedData.notasGenerales,
                panelVtsSerie: validatedData.panelVtsSerie,
                pedalVtsSerie: validatedData.pedalVtsSerie,
                biarticTipoDispositivo: validatedData.biarticTipoDispositivo,
                empresa: empresaUpdate,
              },
            });
            return equipo;
          });
          return updatedEquipo;
        } catch (error) {
          if (error instanceof ZodError) { // Importar ZodError
            throw new Error("Error de validación al actualizar equipo: " + error.errors.map(e => e.message).join(", "));
          }
          console.error(`Error al actualizar equipo de inventario con ID ${data.id} en EquipoInventarioService:`, error);
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') { // Unique constraint failed (e.g., on identificadorUnico)
              throw new Error("El identificador único ya existe.");
            }
          }
          throw new Error("Error al actualizar el equipo de inventario. Detalles: " + (error as Error).message);
        }
      }

      /**
       * Elimina un equipo de inventario.
       * Antes de eliminar, verifica si tiene préstamos asociados.
       * @param id El ID del equipo a eliminar.
       * @returns Un objeto de éxito o error.
       */
      static async deleteEquipoInventario(id: string): Promise<{ success: boolean; message?: string }> {
        try {
          await prisma.$transaction(async (tx) => {
            // Verificar si el equipo tiene préstamos asociados (onDelete: RESTRICT en EquipoEnPrestamo)
            const prestamosCount = await tx.equipoEnPrestamo.count({
              where: { equipoId: id },
            });

            if (prestamosCount > 0) {
              // CORRECCIÓN: Lanzar una excepción aquí
              throw new Error("No se puede eliminar el equipo porque tiene registros de préstamos asociados.");
            }

            // Eliminar el equipo
            await tx.equipoInventario.delete({
              where: { id },
            });
          });
          return { success: true, message: "Equipo de inventario eliminado exitosamente." };
        } catch (error: any) {
          console.error(`Error al eliminar equipo de inventario con ID ${id} en EquipoInventarioService:`, error);
          // Si el error es de negocio, relanzar para que los tests lo capturen con rejects.toThrow
          if (error instanceof Error && (
            error.message.includes("No se puede eliminar el equipo porque tiene registros de préstamos asociados.")
          )) {
            throw error;
          }
          // Si es error de Prisma u otro, lanzar con mensaje estándar
          throw new Error("Error al eliminar el equipo de inventario. Detalles: " + (error as Error).message);
        }
      }
    }
    
