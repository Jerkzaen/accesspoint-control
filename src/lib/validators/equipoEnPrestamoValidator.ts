// src/lib/validators/equipoEnPrestamoValidator.ts
import { z } from "zod";
import { EstadoPrestamoEquipo } from "@prisma/client";

// Esquema Zod para validar los datos de un EquipoEnPrestamo
export const equipoEnPrestamoSchema = z.object({
  id: z.string().uuid().optional(), // El ID es opcional al crear un nuevo préstamo
  equipoId: z.string().uuid("ID de equipo inválido."), // ID del EquipoInventario
  prestadoAContactoId: z.string().uuid("ID de contacto de préstamo inválido."), // ID del ContactoEmpresa
  personaResponsableEnSitio: z.string().min(3, "La persona responsable en sitio es requerida y debe tener al menos 3 caracteres."),
  fechaPrestamo: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date({ invalid_type_error: "Fecha de préstamo inválida." })).optional(), // Default en Prisma, opcional en input
  fechaDevolucionEstimada: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date({ invalid_type_error: "Fecha de devolución estimada inválida." })),
  fechaDevolucionReal: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date({ invalid_type_error: "Fecha de devolución real inválida." })).optional().nullable(),
  estadoPrestamo: z.nativeEnum(EstadoPrestamoEquipo, {
    errorMap: () => ({ message: "Estado de préstamo inválido." })
  }).default(EstadoPrestamoEquipo.PRESTADO),
  ticketId: z.string().uuid("ID de ticket inválido.").optional().nullable(), // Relación con Ticket
  notasPrestamo: z.string().optional().nullable(),
  notasDevolucion: z.string().optional().nullable(),
  entregadoPorUsuarioId: z.string().uuid("ID de usuario de entrega inválido.").optional().nullable(), // ID del User que entrega
  recibidoPorUsuarioId: z.string().uuid("ID de usuario de recepción inválido.").optional().nullable(), // ID del User que recibe
});

// Esquema Zod para la creación de un EquipoEnPrestamo
export const createEquipoEnPrestamoSchema = equipoEnPrestamoSchema.omit({ id: true, fechaPrestamo: true }).extend({
  equipoId: z.string().uuid("El ID del equipo es requerido para la creación."),
  prestadoAContactoId: z.string().uuid("El ID del contacto de préstamo es requerido para la creación."),
  personaResponsableEnSitio: z.string().min(3, "La persona responsable en sitio es requerida para la creación."),
  fechaDevolucionEstimada: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date({ invalid_type_error: "La fecha de devolución estimada es requerida para la creación." })),
});

// Esquema Zod para la actualización de un EquipoEnPrestamo (todos los campos son opcionales)
export const updateEquipoEnPrestamoSchema = equipoEnPrestamoSchema.partial();

// Exportar tipos TypeScript derivados de los esquemas Zod
export type EquipoEnPrestamoInput = z.infer<typeof equipoEnPrestamoSchema>;
export type EquipoEnPrestamoCreateInput = z.infer<typeof createEquipoEnPrestamoSchema>;
export type EquipoEnPrestamoUpdateInput = z.infer<typeof updateEquipoEnPrestamoSchema>;
