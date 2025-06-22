// src/lib/validators/ticketValidator.ts
import { z } from "zod";
import { PrioridadTicket, EstadoTicket } from "@prisma/client";

// Esquema para el préstamo de equipo (opcional en la creación del ticket)
const equipoPrestamoSchema = z.object({
  equipoId: z.string().uuid("ID de equipo inválido."),
  prestadoAContactoId: z.string().uuid("ID de contacto de préstamo inválido."),
  personaResponsableEnSitio: z.string().min(1, "La persona responsable es requerida."),
  fechaDevolucionEstimada: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date({ invalid_type_error: "Fecha de devolución estimada inválida." })),
  notasPrestamo: z.string().optional().nullable(),
});

// Esquema para la acción de ticket
export const accionTicketSchema = z.object({
  ticketId: z.string().uuid("ID de ticket inválido."),
  descripcion: z.string().min(10, "La descripción de la acción debe tener al menos 10 caracteres."),
  usuarioId: z.string().uuid("ID de usuario inválido."),
  categoria: z.string().optional().nullable(),
});

// Esquema principal para Ticket
export const ticketSchema = z.object({
  id: z.string().uuid().optional(), // ID es opcional al crear
  numeroCaso: z.number().int().positive("El número de caso debe ser un entero positivo.").optional(), // Generado en el backend
  titulo: z.string().min(5, "El título del ticket debe tener al menos 5 caracteres."),
  descripcionDetallada: z.string().min(10, "La descripción detallada debe tener al menos 10 caracteres.").optional().nullable(),
  tipoIncidente: z.string().min(3, "El tipo de incidente es requerido."),
  prioridad: z.nativeEnum(PrioridadTicket).default(PrioridadTicket.MEDIA),
  estado: z.nativeEnum(EstadoTicket).default(EstadoTicket.ABIERTO),
  solicitanteNombre: z.string().min(3, "El nombre del solicitante es requerido."),
  solicitanteTelefono: z.string().optional().nullable(),
  solicitanteCorreo: z.string().email("Formato de correo electrónico inválido.").optional().nullable(),
  contactoId: z.string().uuid("ID de contacto inválido.").optional().nullable(),
  empresaId: z.string().uuid("ID de empresa inválido.").optional().nullable(),
  sucursalId: z.string().uuid("ID de sucursal inválido.").optional().nullable(),
  creadoPorUsuarioId: z.string().uuid("ID de usuario creador inválido."),
  tecnicoAsignadoId: z.string().uuid("ID de técnico asignado inválido.").optional().nullable(),
  fechaCreacion: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date()).optional(), // Se genera en el backend
  fechaSolucionEstimada: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date().optional().nullable()),
  fechaSolucionReal: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date().optional().nullable()),
  equipoAfectado: z.string().optional().nullable(),
  
  // Relaciones anidadas para la creación/actualización
  equipoPrestamo: equipoPrestamoSchema.optional(), // Para la creación con préstamo

  // No incluimos las relaciones de arrays (acciones, equiposEnPrestamo) aquí
  // ya que son manejadas por separado o son el resultado de la base de datos.
});

// Esquema para la creación de tickets
export const createTicketSchema = ticketSchema.omit({ id: true, fechaCreacion: true }).extend({
    // Puedes hacer campos específicos requeridos para la creación aquí
    titulo: z.string().min(5, "El título del ticket es requerido."),
    solicitanteNombre: z.string().min(3, "El nombre del solicitante es requerido."),
    creadoPorUsuarioId: z.string().uuid("El ID del usuario creador es requerido."),
});

// Esquema para la actualización de tickets (todos los campos son opcionales)
export const updateTicketSchema = ticketSchema.partial();
