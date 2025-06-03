// src/types/ticket.ts
export interface Ticket {
  id: string;
  numeroCaso: number;         // Antes nroCaso
  empresa: string;
  tipoIncidente: string;      // Antes tipo
  ubicacion: string;
  tecnicoAsignado: string;    // Antes tecnico
  solicitante: string;        // Antes contacto
  titulo: string;             // Antes descripcion (en el modelo Prisma)
  descripcionDetallada?: string | null; // Nuevo campo
  prioridad: string;
  estado: string;
  acciones: string;           // Se mantiene como string JSON
  fechaCreacion: string;      // Antes createdAt (viene como string ISO del backend)
  fechaSolucion?: string | null;
  fechaActualizacion: string; // Nuevo campo (viene como string ISO del backend)
}

export interface ActionEntry {
  id: string;
  fecha: string;
  descripcion: string;
}
