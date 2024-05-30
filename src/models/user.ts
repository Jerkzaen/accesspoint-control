import { Schema, model, models } from "mongoose";

// Definir el esquema de la colección
const userSchema = new Schema({
  email: {
    type: String,
    required:[true, "El correo es requerido"],
    unique: true,
    match: [
      /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
      "Por favor, ingrese un correo válido",
    ],
  },
  password: {
    type: String,
    required: [true, "La contraseña es requerida"],
    select: false,
    minlength: 6,
  },
  fullname: {
    type: String,
    required: [true, "El nombre es requerido"],
    minlength: [3, "El nombre debe tener al menos 3 caracteres"],
    maxlength: [50, "El nombre no puede tener más de 50 caracteres"],
  },
});

// Definir el modelo de la colección
const User = models.User || model("User", userSchema);
export default User;