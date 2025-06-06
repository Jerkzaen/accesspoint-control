// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número a un string con ceros a la izquierda.
 * @param num El número a formatear.
 * @param size El número total de dígitos deseados (ej. 5 para 00001).
 * @returns El número formateado como string.
 */
export function formatTicketNumber(num: number, size: number = 5): string {
  if (typeof num !== 'number' || isNaN(num)) {
    // Manejar el caso de que num no sea un número válido, podrías devolver un string vacío o un placeholder
    return '0'.repeat(size); 
  }
  let s = String(num);
  while (s.length < size) {
    s = "0" + s;
  }
  return s;
}

/**
 * Mapea el nombre de una empresa a la URL de su logo.
 * Asume que los logos están en /public/images/.
 * @param companyName El nombre de la empresa (ej. "CMT", "Achs").
 * @returns La URL del logo o un string vacío si no se encuentra o si companyName es undefined.
 */
export function getCompanyLogoUrl(companyName?: string | null): string { // Hacer companyName opcional
  // Verificar si companyName es undefined, null o una cadena vacía antes de llamar a toLowerCase()
  if (!companyName || typeof companyName !== 'string') {
    return ''; // O una imagen de logo por defecto si lo prefieres
  }

  const lowerCaseName = companyName.toLowerCase();
  switch (lowerCaseName) {
    case 'achs':
      return '/images/achs-logo.png'; // Asegúrate que esta ruta exista
    case 'esachs':
      return '/images/esachs-logo.png'; // Asegúrate que esta ruta exista
    case 'cmt':
      return '/images/cmt-logo.png'; // Asegúrate que esta ruta exista
    default:
      return ''; // O una imagen de logo por defecto
  }
}
