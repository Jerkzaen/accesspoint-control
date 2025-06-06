// src/types/ticket.ts

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
  // CORRECCIÓN: fechaAccion es un objeto Date cuando se obtiene de Prisma
  fechaAccion: Date; 
  descripcion: string;
  realizadaPor?: UsuarioBasico | null; 
  usuarioId?: string; // El ID del usuario, por si acaso
}

export interface Ticket {
  id: string;
  numeroCaso: number;
  titulo: string;
  descripcionDetallada?: string | null;
  tipoIncidente: string;
  prioridad: string; 
  estado: string;    
  
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

  // Ahora acciones es un array de ActionEntry, no un string JSON
  acciones?: ActionEntry[] | null; 

  // CORRECCIÓN: Las propiedades de fecha de Ticket ahora son de tipo Date
  fechaCreacion: Date; 
  fechaSolucionEstimada?: Date | null;
  fechaSolucionReal?: Date | null; 
  updatedAt: Date; 
}
