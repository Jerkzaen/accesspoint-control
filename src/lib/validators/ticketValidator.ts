// RUTA: src/lib/validators/ticketValidator.ts

import { z } from "zod";
import { PrioridadTicket, EstadoTicket, TipoAccion } from "@prisma/client";

// --- tus otros schemas (equipoPrestamo, accionTicket) se mantienen igual ---
// ...

// --- PASO 1: Creamos un esquema base SIN el .refine() ---
const baseTicketSchema = z.object({
  id: z.string().uuid().optional(),
  titulo: z.string().min(1, "El título es requerido."),
  descripcionDetallada: z.string().optional().nullable(),
  tipoIncidente: z.string(),
  prioridad: z.nativeEnum(PrioridadTicket).default('MEDIA'),
  estado: z.nativeEnum(EstadoTicket).default('ABIERTO'),
  solicitanteNombre: z.string().min(1, "El nombre del solicitante es requerido."),
  
  // --- CAMPOS PARA LA NUEVA LÓGICA DE SUCURSAL ---
  sucursalId: z.string().uuid().optional().nullable(),
  
  nuevaSucursal: z.object({
      nombre: z.string().min(1, "El nombre de la nueva sucursal es requerido."),
      comunaId: z.string().uuid("Se requiere una comuna para la nueva sucursal."),
      direccion: z.object({
          calle: z.string().min(1, "La calle es requerida."),
          numero: z.string().min(1, "El número es requerido."),
          depto: z.string().optional().nullable(),
      }),
  }).optional(),

  empresaId: z.string().uuid().optional().nullable(),
  contactoId: z.string().uuid().optional().nullable(),
  tecnicoAsignadoId: z.string().uuid().optional().nullable(),
});

// --- PASO 2: Creamos el createTicketSchema y LUEGO aplicamos el .refine() ---
// Ahora .omit() se aplica sobre un objeto simple, lo cual es correcto.
export const createTicketSchema = baseTicketSchema
  .omit({ id: true }) 
  .refine(data => { 
    // La lógica de validación cruzada se aplica al final
    return !!data.sucursalId || !!data.nuevaSucursal;
  }, {
    message: "Debe proporcionar una sucursal existente o los datos para crear una nueva.",
    path: ["sucursalId"],
});

// --- PASO 3: Creamos el updateTicketSchema desde el esquema base ---
// Ahora .partial() se aplica sobre un objeto simple, lo cual es correcto.
export const updateTicketSchema = baseTicketSchema.partial();