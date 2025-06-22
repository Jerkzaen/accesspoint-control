// src/types/ticket.ts

// Importamos los tipos de enums directamente desde Prisma Client
import { EstadoTicket, PrioridadTicket } from '@prisma/client';

// Re-exportamos los tipos de entrada y el tipo de relación principal del servicio,
// usando 'export type' para compatibilidad con 'isolatedModules'.
export type {
  TicketCreateInput,
  TicketUpdateInput,
  AccionTicketCreateInput,
} from "@/services/ticketService";


// Interfaces de Relación (manteniendo las tuyas personalizadas para la compatibilidad con el frontend)
// Estas interfaces definen la forma de los objetos relacionados tal como los espera tu UI.
export interface EmpresaRelacion {
  id: string;
  nombre: string;
}

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
  usuarioId?: string; // Mantener si es necesario para el frontend, aunque en el servicio se usa `realizadaPor`
  categoria?: string | null;
}

export interface EquipoInventarioBasico {
  id: string;
  nombreDescriptivo: string;
  identificadorUnico: string;
}

export interface ContactoEmpresaBasico {
  id: string;
  nombreCompleto: string;
  email?: string | null;
  telefono?: string | null;
}

export interface EquipoEnPrestamoEntry {
  id: string;
  equipoId: string;
  equipo?: EquipoInventarioBasico; // Relación con el equipo
  prestadoAContactoId: string;
  prestadoAContacto?: ContactoEmpresaBasico | null; // Puede ser null
  personaResponsableEnSitio: string;
  fechaPrestamo: Date;
  fechaDevolucionEstimada: Date;
  fechaDevolucionReal?: Date | null;
  estadoPrestamo: string; // O el Enum EstadoPrestamoEquipo
  ticketId?: string | null;
  notasPrestamo?: string | null;
  notasDevolucion?: string | null;
}


// --- Interfaz Ticket Principal para el Frontend (DTO) ---
// Esta interfaz combina los campos del modelo Prisma Ticket con tus interfaces de relación personalizadas.
// `TicketWithRelations` del servicio será compatible con esta interfaz cuando se obtienen tickets detallados.
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
  // Usamos las interfaces personalizadas aquí para el frontend
  empresa?: EmpresaRelacion | null;
  sucursal?: SucursalRelacion | null;
  contacto?: ContactoEmpresaBasico | null; // Puede ser null
  tecnicoAsignado?: UsuarioBasico | null;
  acciones?: ActionEntry[] | null;
  equiposEnPrestamo?: EquipoEnPrestamoEntry[] | null; // Usar EquipoEnPrestamoEntry
  creadoPorUsuario?: UsuarioBasico | null; // Puede ser null (si se permite null en Prisma o si la relación no siempre se carga)

  // IDs de las relaciones (para compatibilidad con inputs)
  empresaId?: string | null;
  sucursalId?: string | null;
  contactoId?: string | null;
  tecnicoAsignadoId?: string | null;
  creadoPorUsuarioId?: string; // Ahora que existe en el esquema, puede ser incluido aquí.


  // Timestamps y otros campos
  fechaCreacion: Date;
  fechaSolucionEstimada?: Date | null;
  fechaSolucionReal?: Date | null;
  updatedAt: Date;
  equipoAfectado?: string | null;
}

export type CreationFlowStatus = 'idle' | 'form' | 'loading' | 'success' | 'error';
