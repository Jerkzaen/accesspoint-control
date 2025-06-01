    // src/types.ts

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
      acciones: string;
      fechaSolucion: string | null;
    }

    export interface ActionEntry {
      id: string;
      fecha: string;
      descripcion: string;
    }

    // ... puedes tener otras interfaces y tipos aquí también