// src/lib/validators/equipoInventarioValidator.ts
import { z } from "zod";
import { EstadoEquipoInventario, TipoEquipoInventario } from "@prisma/client";

// Esquema Zod para validar los datos de un EquipoInventario
export const equipoInventarioSchema = z.object({
  id: z.string().uuid().optional(), // El ID es opcional al crear un nuevo equipo
  nombreDescriptivo: z.string().min(3, "El nombre descriptivo es requerido y debe tener al menos 3 caracteres."),
  identificadorUnico: z.string().min(3, "El identificador único es requerido y debe tener al menos 3 caracteres."), // Es único en Prisma
  parentEquipoId: z.string().uuid("ID de equipo padre inválido.").optional().nullable(), // Relación con EquipoInventario
  tipoEquipo: z.nativeEnum(TipoEquipoInventario, {
    errorMap: () => ({ message: "Tipo de equipo inválido." })
  }),
  marca: z.string().optional().nullable(),
  modelo: z.string().optional().nullable(),
  descripcionAdicional: z.string().optional().nullable(),
  estadoEquipo: z.nativeEnum(EstadoEquipoInventario, {
    errorMap: () => ({ message: "Estado de equipo inválido." })
  }).default(EstadoEquipoInventario.DISPONIBLE),
  fechaAdquisicion: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date({ invalid_type_error: "Fecha de adquisición inválida." })).optional().nullable(),
  proveedor: z.string().optional().nullable(),
  ubicacionActualId: z.string().uuid("ID de ubicación inválido.").optional().nullable(), // Relación con Ubicacion
  notasGenerales: z.string().optional().nullable(),
  panelVtsSerie: z.string().optional().nullable(),
  pedalVtsSerie: z.string().optional().nullable(),
  biarticTipoDispositivo: z.string().optional().nullable(),
  empresaId: z.string().uuid("ID de empresa inválido.").optional().nullable(), // Relación con Empresa
});

// Esquema Zod para la creación de un EquipoInventario
export const createEquipoInventarioSchema = equipoInventarioSchema.omit({ id: true }).extend({
  nombreDescriptivo: z.string().min(3, "El nombre descriptivo es requerido."),
  identificadorUnico: z.string().min(3, "El identificador único es requerido."),
  tipoEquipo: z.nativeEnum(TipoEquipoInventario, {
    errorMap: () => ({ message: "Tipo de equipo es requerido." })
  }),
});

// Esquema Zod para la actualización de un EquipoInventario (todos los campos son opcionales)
export const updateEquipoInventarioSchema = equipoInventarioSchema.partial();

// Derivar tipos de los esquemas para usarlos en servicios y API
export type EquipoInventarioCreateInput = z.infer<typeof createEquipoInventarioSchema>;
export type EquipoInventarioUpdateInput = z.infer<typeof updateEquipoInventarioSchema>;
