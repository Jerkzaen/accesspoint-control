// src/lib/validators/empresaValidator.ts
import { z } from "zod";

// Esquema para la dirección principal, si se envía junto con la empresa
// Nota: La comunaId debe ser validada contra una lista existente si es posible,
// pero Zod solo validará el formato de string aquí.
const direccionPrincipalSchema = z.object({
  id: z.string().uuid().optional(), // ID es opcional para nuevas direcciones
  calle: z.string().min(1, "La calle es requerida."),
  numero: z.string().min(1, "El número es requerido."),
  depto: z.string().optional().nullable(),
  comunaId: z.string().uuid("ID de comuna inválido."),
});

// Esquema principal para Empresa
export const empresaSchema = z.object({
  id: z.string().uuid().optional(), // ID es opcional al crear
  nombre: z.string().min(3, "El nombre de la empresa debe tener al menos 3 caracteres."),
  rut: z.string().regex(/^\d{7,8}-[\dkK]$/, "Formato de RUT inválido (ej: 12345678-9)."),
  logoUrl: z.string().url("URL de logo inválida.").optional().nullable(),
  telefono: z.string().min(7, "El teléfono es requerido y debe tener al menos 7 dígitos.").optional().nullable(),
  email: z.string().email("Formato de correo electrónico inválido.").optional().nullable(),
  
  // Relación con direccionPrincipal: puede ser un objeto de dirección o null (para desvincular)
  direccionPrincipal: direccionPrincipalSchema.optional().nullable(),
  direccionPrincipalId: z.string().uuid("ID de dirección principal inválido.").optional().nullable(),
  
  // No incluimos las relaciones de arrays (sucursales, contactos, etc.) aquí para la validación de entrada,
  // ya que son manejadas por separado o son el resultado de la base de datos.
});

// Puedes crear un esquema para la creación que requiera menos campos si es necesario
export const createEmpresaSchema = empresaSchema.omit({ id: true }).extend({
  nombre: z.string().min(3, "El nombre de la empresa es requerido."),
  rut: z.string().regex(/^\d{7,8}-[\dkK]$/, "El RUT es requerido y debe tener formato válido (ej: 12345678-9)."),
  // Puedes hacer la dirección principal requerida aquí si siempre se crea con una.
  // direccionPrincipal: direccionPrincipalSchema.optional(),
});

// Esquema para actualización (todos los campos son opcionales)
export const updateEmpresaSchema = empresaSchema.partial();

