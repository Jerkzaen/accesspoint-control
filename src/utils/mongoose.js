//Importamos mongoose para conectarnos a la base de datos
import { connect, connection } from "mongoose";

// Objeto de conexión a la base de datos
const conn = {
  // Inicialmente no está conectado
  isConnected: false,
};

// Conexión a la base de datos
export async function connectDB() {
  // Si ya estamos conectados, no hacemos nada
  if (conn.isConnected) return;
  // Conectamos a la base de datos
  const db = await connect("mongodb://localhost/apcontrol");
  // Mostramos el nombre de la base de datos
  console.log(db.connection.db.databaseName);
  // Asignamos la conexión a nuestro objeto
  conn.isConnected = db.connections[0].readyState;
}

// Si la conexión es exitosa
connection.on("connected", () => {
  // Mostramos un mensaje de éxito
  console.log("Base de datos conectada");
});

// Si la conexión falla
connection.on("error", (err) => {
  // Mostramos un mensaje de error
  console.log("Error en la conexion de la Base de datos:", err);
});
