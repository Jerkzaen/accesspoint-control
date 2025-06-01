export interface Ticket {
  id: string;
  nroCaso: number;
  empresa: string;
  prioridad: string;
  tecnico: string;
  tipo: string;
  ubicacion: string;
  contacto: string;
  createdAt: string;
  descripcion: string;
  estado: string;
  acciones: string; // Asegúrate que esté aquí
  fechaSolucion: string | null; // Asegúrate que esté aquí
}

export interface ActionEntry {
  id: string;
  fecha: string;
  descripcion: string;
}
