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
  fechaAccion: string; // Debería ser un ISO string o un string formateado consistentemente
  descripcion: string;
  realizadaPor?: UsuarioBasico | null; // El usuario que realizó la acción
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

  fechaCreacion: string; 
  fechaSolucionEstimada?: string | null;
  fechaSolucionReal?: string | null; 
  updatedAt: string; 
}
