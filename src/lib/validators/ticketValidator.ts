// RUTA: src/lib/validators/ticketValidator.ts

import { z } from "zod";
import { PrioridadTicket, EstadoTicket, TipoAccion } from "@prisma/client";

// Este schema se mantiene igual
const equipoPrestamoSchema = z.object({
  equipoId: z.string().uuid("ID de equipo inválido."),
  prestadoAContactoId: z.string().uuid("ID de contacto de préstamo inválido."),
  personaResponsableEnSitio: z.string().min(1, "La persona responsable es requerida."),
  fechaDevolucionEstimada: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date({ invalid_type_error: "Fecha de devolución estimada inválida." })),
  notasPrestamo: z.string().optional().nullable(),
});

// --- ESQUEMA PARA CREAR ACCIONES (Completo) ---
export const createAccionTicketSchema = z.object({
  ticketId: z.string().uuid("ID de ticket inválido."),
  descripcion: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  usuarioId: z.string().uuid("ID de usuario inválido."),
  tipo: z.nativeEnum(TipoAccion).optional().default('SEGUIMIENTO'),
  tiempoInvertidoMinutos: z.number().int().positive("El tiempo debe ser un número positivo.").optional().nullable(),
  nuevoEstado: z.nativeEnum(EstadoTicket).optional().nullable(),
});

// --- ESQUEMA PARA ACTUALIZAR ACCIONES (CORREGIDO para evitar el error 'never') ---
export const updateAccionTicketSchema = z.object({
  descripcion: z.string().min(10, "La descripción debe tener al menos 10 caracteres.").optional(),
  tipo: z.nativeEnum(TipoAccion).optional(),
  tiempoInvertidoMinutos: z.number().int().positive("El tiempo debe ser un número positivo.").optional().nullable(),
}).partial();

// El resto de tus esquemas de ticket
export const ticketSchema = z.object({
  // Aquí va la definición completa de tu ticketSchema que ya tienes
  id: z.string().uuid().optional(),
  titulo: z.string().optional(),
  // ... etc
});

export const createTicketSchema = ticketSchema.omit({ id: true }); // Asumiendo que omites el id al crear

export const updateTicketSchema = ticketSchema.partial();