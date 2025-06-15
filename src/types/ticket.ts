// src/types/ticket.ts

import { EstadoTicket, PrioridadTicket } from '@prisma/client'; // Importar los enums de Prisma

// TIPO MOVIDO AQUÍ para romper la dependencia circular
export type CreationFlowStatus = 'idle' | 'form' | 'loading' | 'success' | 'error';

export interface EmpresaClienteRelacion {
  id: string;
  nombre: string;
}

export interface UbicacionRelacion {
  id: string;
  nombreReferencial?: string | null;
  direccionCompleta: string;
}

export interface UsuarioBasico { // Para el técnico y el usuario que realiza la acción
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
  solicitanteClienteId?: string | null; 

  empresaCliente?: EmpresaClienteRelacion | null; 
  ubicacion?: UbicacionRelacion | null; 
  tecnicoAsignado?: UsuarioBasico | null;

  empresaClienteId?: string | null;
  ubicacionId?: string | null;
  tecnicoAsignadoId?: string | null;

  acciones?: ActionEntry[] | null; 

  fechaCreacion: Date; 
  fechaSolucionEstimada?: Date | null;
  fechaSolucionReal?: Date | null; 
  updatedAt: Date; 
  equipoAfectado?: string | null; // Nuevo campo para el equipo afectado
}
