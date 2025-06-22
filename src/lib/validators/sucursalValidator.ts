// src/lib/validators/sucursalValidator.ts
import { z } from "zod";

// Esquema para la dirección anidada en la sucursal
const sucursalDireccionSchema = z.object({
  id: z.string().uuid().optional(), // ID es opcional para nuevas direcciones o si se envía desde la UI
  calle: z.string().min(1, "La calle es requerida."),
  numero: z.string().min(1, "El número es requerido."),
  depto: z.string().optional().nullable(),
  comunaId: z.string().uuid("ID de comuna inválido."),
});

// Esquema principal para Sucursal
export const sucursalSchema = z.object({
  id: z.string().uuid().optional(), // ID es opcional al crear
  nombre: z.string().min(3, "El nombre de la sucursal debe tener al menos 3 caracteres."),
  telefono: z.string().min(7, "El teléfono es requerido y debe tener al menos 7 dígitos.").optional().nullable(),
  email: z.string().email("Formato de correo electrónico inválido.").optional().nullable(),
  
  // Relación con empresa
  empresaId: z.string().uuid("ID de empresa inválido.").optional().nullable(), // Puede ser null para sucursales sin empresa asignada (aunque idealmente siempre asociada)
  
  // La dirección es requerida al crear una sucursal y puede ser actualizada
  direccion: sucursalDireccionSchema,
  direccionId: z.string().uuid("ID de dirección inválido.").optional(), // Esto se usará internamente si la dirección existe
});

// Esquema para la creación de sucursales (direccion es requerida)
export const createSucursalSchema = sucursalSchema.omit({ id: true }).extend({
  nombre: z.string().min(3, "El nombre de la sucursal es requerido."),
  direccion: sucursalDireccionSchema.refine(data => data.calle && data.numero && data.comunaId, {
    message: "La dirección principal es requerida y debe contener calle, número y comuna."
  }),
});

// Esquema para la actualización de sucursales (todos los campos son opcionales)
export const updateSucursalSchema = sucursalSchema.partial();
