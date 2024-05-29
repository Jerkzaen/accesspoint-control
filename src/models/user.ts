// Importar los módulos necesarios a utilizar
import { Schema, model, models } from "mongoose";

// Definir el esquema de la colección
const userSchema = new Schema({
  email: {
    type: String.toString(),
    required: true,
    unique: [true, "El correo es requerido"],
    match: [
      /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
      "Por favor, ingrese un correo válido",
    ],
  },
  password: {
    type: String.toString(),
    required: [true, "La contraseña es requerida"],
    select: false,
    minlength: 6,
    maxlength: 12,
  },
  fullname: {
    type: String.toString(),
    required: [true, "El nombre es requerido"],
    minlength: [3, "El nombre debe tener al menos 3 caracteres"],
    maxlength: [50, "El nombre no puede tener más de 50 caracteres"],
  },
});
// Definir el modelo de la colección
const User = models.User || model("User", userSchema);
export default User;