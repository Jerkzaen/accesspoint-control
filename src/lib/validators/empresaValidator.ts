// RUTA: src/lib/validators/empresaValidator.ts
import { z } from 'zod';

export const empresaSchema = z.object({
  nombre: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  rut: z.string().min(8, "El RUT es obligatorio y debe ser válido."),
  telefono: z.string().nullable().optional(), 
  email: z.string().email("Debe ser un email válido.").nullable().optional(), 
  logoUrl: z.string().url("Debe ser una URL válida.").nullable().optional(), 
  // La dirección es opcional como objeto.
  // Pero si el objeto 'direccion' se proporciona, sus campos internos son REQUERIDOS y NO NULOS.
  direccion: z.object({
      // CAMBIO CRÍTICO: calle y numero ahora son z.string().min(1) - REQUERIDOS y NO NULOS
      calle: z.string().min(1, "La calle es obligatoria si se proporciona dirección."), 
      numero: z.string().min(1, "El número es obligatorio si se proporciona dirección."), 
      // CAMBIO CRÍTICO: comunaId es z.string().uuid() - REQUERIDO y NO NULO
      comunaId: z.string().uuid("Debe ser un ID de comuna válido si se proporciona dirección."), 
  }).optional(), // El objeto completo de dirección SIGUE SIENDO OPCIONAL
});

export type EmpresaInput = z.infer<typeof empresaSchema>;

