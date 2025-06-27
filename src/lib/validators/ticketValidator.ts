// RUTA: src/lib/validators/ticketValidator.ts (VERSIÓN FINAL Y COMPLETA)

import { z } from "zod";
import { PrioridadTicket, EstadoTicket, TipoAccion } from "@prisma/client";

// --- ESQUEMA BASE PARA TICKETS ---
const ticketSchema = z.object({
  id: z.string().uuid().optional(),
  numeroCaso: z.number().int().optional(),
  titulo: z.string().min(1, "El título es requerido."),
  descripcionDetallada: z.string().optional().nullable(),
  tipoIncidente: z.string().min(1, "El tipo de incidente es requerido."),
  prioridad: z.nativeEnum(PrioridadTicket).default('MEDIA'),
  estado: z.nativeEnum(EstadoTicket).default('ABIERTO'),
  solicitanteNombre: z.string().min(1, "El nombre del solicitante es requerido."),
  solicitanteTelefono: z.string().optional().nullable(),
  solicitanteCorreo: z.string().email("Correo inválido.").optional().nullable(),
  creadoPorUsuarioId: z.string().uuid("El creador del ticket es requerido."),
  contactoId: z.string().uuid().optional().nullable(),
  empresaId: z.string().uuid().optional().nullable(),
  sucursalId: z.string().uuid().optional().nullable(),
  tecnicoAsignadoId: z.string().uuid().optional().nullable(),
  nuevaSucursal: z.object({
      nombre: z.string().min(1, "El nombre de la nueva sucursal es requerido."),
      comunaId: z.string().uuid("Se requiere una comuna para la nueva sucursal."),
      direccion: z.object({
          calle: z.string().min(1, "La calle es requerida."),
          numero: z.string().min(1, "El número es requerido."),
          depto: z.string().optional().nullable(),
      }),
  }).optional(),
});

// --- ESQUEMAS EXPORTADOS PARA TICKET ---
export const createTicketSchema = ticketSchema
  .omit({ id: true }) 
  .refine(data => !!data.sucursalId || !!data.nuevaSucursal, {
    message: "Debe proporcionar una sucursal existente o los datos para crear una nueva.",
    path: ["sucursalId"],
});
export const updateTicketSchema = ticketSchema.partial();

// --- ESQUEMAS PARA ACCION TICKET (AHORA COMPLETOS) ---
export const createAccionTicketSchema = z.object({
  ticketId: z.string().uuid(),
  usuarioId: z.string().uuid(),
  descripcion: z.string().min(1, "La descripción es requerida."),
  tipo: z.nativeEnum(TipoAccion).optional(),
  tiempoInvertidoMinutos: z.number().int().optional().nullable(),
  nuevoEstado: z.nativeEnum(EstadoTicket).optional().nullable(),
});

export const updateAccionTicketSchema = z.object({
  descripcion: z.string().min(1).optional(),
  tipo: z.nativeEnum(TipoAccion).optional(),
  tiempoInvertidoMinutos: z.number().int().optional().nullable(),
}).partial();