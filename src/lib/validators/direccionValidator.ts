// src/lib/validators/direccionValidator.ts
import { z } from "zod";

// Esquema Zod para validar los datos de una Dirección
export const direccionSchema = z.object({
  id: z.string().uuid().optional(), // El ID es opcional al crear una nueva dirección
  calle: z.string().min(1, "La calle es requerida."),
  numero: z.string().min(1, "El número es requerido."),
  depto: z.string().optional().nullable(), // El departamento es opcional y puede ser nulo
  comunaId: z.string().uuid("El ID de la comuna no es válido.").min(1, "La comuna es requerida."),
});

// Esquema Zod para la creación de una Dirección (todos los campos son requeridos excepto id y depto)
export const createDireccionSchema = direccionSchema.omit({ id: true }).extend({
  calle: z.string().min(1, "La calle es requerida para la creación."),
  numero: z.string().min(1, "El número es requerido para la creación."),
  comunaId: z.string().uuid("El ID de la comuna no es válido.").min(1, "La comuna es requerida para la creación."),
});

// Esquema Zod para la actualización de una Dirección (todos los campos son opcionales)
export const updateDireccionSchema = direccionSchema.partial();
