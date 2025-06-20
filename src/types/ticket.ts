// src/types/ticket.ts

import { EstadoTicket, PrioridadTicket } from '@prisma/client';

export type CreationFlowStatus = 'idle' | 'form' | 'loading' | 'success' | 'error';

// Relaciones que se incluyen en las consultas de Ticket
export interface EmpresaRelacion {
  id: string;
  nombre: string;
}

// --- CAMBIO CLAVE ---
// Nueva interfaz para la relación con Sucursal.
export interface SucursalRelacion {
  id: string;
  nombre: string;
}

export interface UsuarioBasico {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface ActionEntry {
  id: string;
  fechaAccion: Date;
  descripcion: string;
  realizadaPor?: UsuarioBasico | null;
  usuarioId?: string;
  categoria?: string | null;
}

// --- Interfaz Ticket Actualizada ---
export interface Ticket {
  id: string;
  numeroCaso: number;
  titulo: string;
  descripcionDetallada?: string | null;
  tipoIncidente: string;
  prioridad: PrioridadTicket;
  estado: EstadoTicket;
  solicitanteNombre: string;
  solicitanteTelefono?: string | null;
  solicitanteCorreo?: string | null;
  
  // Relaciones
  empresa?: EmpresaRelacion | null;
  sucursal?: SucursalRelacion | null; // Se usa la nueva relación
  contacto?: any; // Mantener como any o definir una interfaz específica
  tecnicoAsignado?: UsuarioBasico | null;
  acciones?: ActionEntry[] | null;

  // IDs de las relaciones
  empresaId?: string | null;
  sucursalId?: string | null; // Se usa el nuevo campo de ID
  contactoId?: string | null;
  tecnicoAsignadoId?: string | null;

  // Timestamps y otros campos
  fechaCreacion: Date;
  fechaSolucionEstimada?: Date | null;
  fechaSolucionReal?: Date | null;
  updatedAt: Date;
  equipoAfectado?: string | null;
}
