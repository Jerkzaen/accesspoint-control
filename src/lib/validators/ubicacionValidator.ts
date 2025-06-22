// src/lib/validators/ubicacionValidator.ts
import { z } from "zod";

// Esquema Zod para validar los datos de una Ubicacion
export const ubicacionSchema = z.object({
  id: z.string().uuid().optional(), // El ID es opcional al crear una nueva ubicación
  nombreReferencial: z.string().min(3, "El nombre referencial es requerido y debe tener al menos 3 caracteres.").optional().nullable(), // Opcional, pero si existe, mínimo 3 caracteres
  sucursalId: z.string().uuid("ID de sucursal inválido.").min(1, "El ID de la sucursal es requerido."), // La sucursal es requerida
  notas: z.string().optional().nullable(), // Las notas son opcionales y pueden ser nulas
});

// Esquema Zod para la creación de una Ubicacion
export const createUbicacionSchema = ubicacionSchema.omit({ id: true }).extend({
  // Aseguramos que sucursalId sea requerido para la creación
  sucursalId: z.string().uuid("ID de sucursal inválido.").min(1, "El ID de la sucursal es requerido para la creación."),
});

// Esquema Zod para la actualización de una Ubicacion (todos los campos son opcionales)
export const updateUbicacionSchema = ubicacionSchema.partial();
