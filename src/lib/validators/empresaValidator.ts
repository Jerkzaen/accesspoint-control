import { z } from 'zod';

// Este es el único schema que necesitaremos. Es simple y claro.
// Define los campos que vienen directamente del formulario.
export const empresaSchema = z.object({
  nombre: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  // Hacemos el RUT obligatorio como en tu schema de Prisma
  rut: z.string().min(8, "El RUT es obligatorio y debe ser válido."), 
  telefono: z.string().optional().nullable(),
  email: z.string().email("Debe ser un email válido.").optional().nullable().or(z.literal('')),
  
  // Anidamos la dirección para que coincida con la estructura del formulario.
  // Todos los campos de dirección son obligatorios si el objeto 'direccion' existe.
  direccion: z.object({
    calle: z.string().min(1, "La calle es obligatoria."),
    numero: z.string().min(1, "El número es obligatorio."),
    depto: z.string().optional().nullable(),
    comunaId: z.string().min(1, "Debe seleccionar una comuna."),
  })
});

// Exportamos el tipo inferido para usarlo en el resto de la aplicación.
export type EmpresaInput = z.infer<typeof empresaSchema>;

