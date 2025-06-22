// src/lib/validators/contactoEmpresaValidator.ts
import { z } from "zod";

// Esquema Zod para validar los datos de un ContactoEmpresa
export const contactoEmpresaSchema = z.object({
  id: z.string().uuid().optional(), // El ID es opcional al crear un nuevo contacto
  nombreCompleto: z.string().min(3, "El nombre completo es requerido y debe tener al menos 3 caracteres."),
  email: z.string().email("Formato de correo electrónico inválido."), // El email es único en Prisma
  telefono: z.string().min(7, "El teléfono es requerido y debe tener al menos 7 dígitos."),
  cargo: z.string().optional().nullable(), // El cargo es opcional y puede ser nulo
  empresaId: z.string().uuid("ID de empresa inválido.").optional().nullable(), // La relación con empresa es opcional
  ubicacionId: z.string().uuid("ID de ubicación inválido.").optional().nullable(), // La relación con ubicación es opcional
});

// Esquema Zod para la creación de un ContactoEmpresa
export const createContactoEmpresaSchema = contactoEmpresaSchema.omit({ id: true }).extend({
  nombreCompleto: z.string().min(3, "El nombre completo es requerido."),
  email: z.string().email("El correo electrónico es requerido y debe tener un formato válido."),
  telefono: z.string().min(7, "El teléfono es requerido."),
});

// Esquema Zod para la actualización de un ContactoEmpresa (todos los campos son opcionales)
export const updateContactoEmpresaSchema = contactoEmpresaSchema.partial();
