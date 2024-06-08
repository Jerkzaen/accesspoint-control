// Importar modulos de mongoose para crear el modelo de Ticket
import {mongoose, Schema, model, models } from "mongoose";



// Crear el esquema de Ticket
const taskSchema = new Schema(
  {
    nroCaso: {
      type: Number,
      default: 0,

      autoIncrement: true,
    },
    empresa: {
      type: String,
      required: [true, "Se debe ingresar una Empresa"],
      trim: true,
    },

    tecnico: {
      type: String,
      required: [true, "Seleccione el tecnico asignado"],
      trim: true,
    },

    tipo: {
      type: String,
      required: [true, "Seleccione el tipo de ticket"],
      trim: true,
    },
    titulo: {
      type: String,
      required: [true, "Se debe ingresar un titulo"],
      trim: true,
    },
    idNotebook: {
      type: String,
      required: [true, "Se debe ingresar un id de equipo"],
      trim: true,
    },
    ubicacion: {
      type: String,
      required: [true, "Se debe ingresar una ubicacion"],
      trim: true,
    },
    contacto: {
      type: String,
      required: [true, "Se debe ingresar un contacto"],
      trim: true,
    },
    descripcion: {
      type: String,
      required: [true, "Se debe ingresar una descripcion del problema"],
      trim: true,
    },
    accion: {
      type: String,
      required: [true, "Se debe ingresar una accion realizada"],
      trim: true,
    },
    prioridad: {
      type: String,
      required: [true, "Se debe ingresar una prioridad"],
      trim: true,
    },
    fechaSolucion: {
      type: String,
      trim: true,
    },
    
  },
  {
    timestamps: true,
  }
  
);

// Exportar el modelo de Ticket
export default models.Ticket || model("Ticket", taskSchema);
