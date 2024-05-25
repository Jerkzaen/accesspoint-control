//Importamos mongoose para conectarnos a la base de datos
import mongoose from "mongoose";
import { connection } from "mongoose";

// Objeto de conexión a la base de datos
const conn = {
  // Inicialmente no está conectado
  isConnected: false,
};

// Función para conectarnos a la base de datos
export async function connectDB() {
  // Verificar si estamos conectados
  if (conn.isConnected) return;
  // Conectamos a la base de datos
  const db = await mongoose.connect(
    "mongodb+srv://AlertPlusDBA:AlertPlus2024APC@cluster0.2cnqbre.mongodb.net/apcontrol"
  );
  // Si no estamos conectados, lanzamos la conexión
  console.log(
    "Conectando a base de datos...",
    "[",
    db.connection.db.databaseName,
    "]",
    "conectado correctamente"
  );
  // Asignamos la conexión a nuestro objeto
  conn.isConnected = db.connections[0].readyState;

  // Si la conexión es exitosa
  connection.on("connected", () => {
    console.log("Base de datos conectada");
  });

  // Si la conexión falla
  connection.on("error", (error) => {
    console.log("Error al conectarse a la base de datos", error);
  });
}
