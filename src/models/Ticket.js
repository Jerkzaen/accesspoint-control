// Importar modulos de mongoose para crear el modelo de Ticket
import { Schema, model, models } from "mongoose";

// Crear el esquema de Ticket
const taskSchema = new Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
  },
  timestamps: true,
});

// Exportar el modelo de Ticket
export default models.Ticket || model("Ticket", taskSchema);
