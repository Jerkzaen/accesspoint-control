import { z } from 'zod';
import { ComunaConProvinciaYRegion } from '@/app/actions/geografiaActions';

// Esquema de validación con Zod para una empresa.
// Se define aquí para poder ser importado de forma segura tanto en el cliente como en el servidor.
export const empresaSchema = z.object({
    nombre: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
    rut: z.string().optional().nullable(),
    telefono: z.string().optional().nullable(),
    direccion: z.object({
        calle: z.string().optional().nullable(),
        numero: z.string().optional().nullable(),
        comunaId: z.string().uuid({ message: "La comuna seleccionada no es válida." }).nullable().optional(),
    }),
});

// Se exporta el tipo inferido para no tener que declararlo en varios lugares.
export type EmpresaInput = z.infer<typeof empresaSchema> & {
  direccion?: {
    comuna?: ComunaConProvinciaYRegion | null;
  };
};
