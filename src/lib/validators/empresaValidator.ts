// RUTA: src/lib/validators/empresaValidator.ts
import { z } from 'zod';

export const empresaSchema = z.object({
  nombre: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  rut: z.string().min(8, "El RUT es obligatorio y debe ser válido."),
  // CAMBIO CLAVE: Usamos .nullable().optional() para permitir string, null o undefined
  telefono: z.string().nullable().optional(), 
  // CAMBIO CLAVE: Usamos .nullable().optional() para permitir string, null o undefined
  email: z.string().email("Debe ser un email válido.").nullable().optional(), 
  // La dirección es opcional como objeto. Si está presente, sus campos son validados.
  direccion: z.object({
      calle: z.string().nullable().optional(), // Ahora puede ser string, null o undefined
      numero: z.string().nullable().optional(), // Ahora puede ser string, null o undefined
      // ComunaId: Puede ser string (UUID), null o undefined.
      comunaId: z.string().uuid("Debe ser un ID de comuna válido.").nullable().optional(), 
  }).optional(), // El objeto completo de dirección es opcional
});

export type EmpresaInput = z.infer<typeof empresaSchema>;

