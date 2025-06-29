// src/lib/validators/ubicacionValidator.ts
import { z } from "zod";

export const ubicacionCreateSchema = z.object({
  nombreReferencial: z.string().min(3, "El nombre referencial es requerido y debe tener al menos 3 caracteres."),
  sucursalId: z.string().uuid("ID de sucursal inválido."),
  notas: z.string().optional(),
});

export const ubicacionUpdateSchema = z.object({
  // El ID no se valida aquí porque ya se obtiene de los parámetros de la ruta.
  nombreReferencial: z.string().min(3, "El nombre referencial es requerido y debe tener al menos 3 caracteres.").optional(),
  sucursalId: z.string().uuid("ID de sucursal inválido.").optional(),
  notas: z.string().optional(),
});

// Derivar tipos de los esquemas para usarlos en servicios y API
export type UbicacionCreateInput = z.infer<typeof ubicacionCreateSchema>;
export type UbicacionUpdateInput = z.infer<typeof ubicacionUpdateSchema>;
