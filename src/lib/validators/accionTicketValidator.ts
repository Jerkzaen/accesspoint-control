// src/lib/validators/accionTicketValidator.ts
import { z } from "zod";

// Esquema Zod para validar los datos de una AccionTicket
export const accionTicketSchema = z.object({
  id: z.string().uuid().optional(), // El ID es opcional al crear una nueva acción
  ticketId: z.string().uuid("El ID del ticket es inválido."), // ID del Ticket al que pertenece la acción
  descripcion: z.string().min(10, "La descripción de la acción es requerida y debe tener al menos 10 caracteres."),
  fechaAccion: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date({ invalid_type_error: "Fecha de acción inválida." })).optional(), // Default en Prisma, opcional en input
  usuarioId: z.string().uuid("El ID del usuario es inválido."), // ID del User que realiza la acción
  categoria: z.string().optional().nullable(), // La categoría es opcional y puede ser nula
});

// Esquema Zod para la creación de una AccionTicket
export const createAccionTicketSchema = accionTicketSchema.omit({ 
  id: true, 
  fechaAccion: true, // Se genera automáticamente en Prisma
  // createdAt y updatedAt también se omiten ya que son manejados por Prisma
}).extend({
  ticketId: z.string().uuid("El ID del ticket es requerido para la creación."),
  descripcion: z.string().min(10, "La descripción de la acción es requerida para la creación."),
  usuarioId: z.string().uuid("El ID del usuario es requerido para la creación."),
});

// Esquema Zod para la actualización de una AccionTicket (todos los campos son opcionales)
export const updateAccionTicketSchema = accionTicketSchema.partial();
