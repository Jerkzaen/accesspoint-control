//CONEXION A MONGODB A TRAVES DE MONGOOSE
import { connect, connection } from "mongoose";

// Conexión a la base de datos
export async function connectDB() {
  const db = await mongoose.connect("mongodb://localhost/apcontrol");
  console.log(db.connection.db.databaseName);
}

// Conexión a la base de datos
connection.on("connected", () => {
  console.log("Base de datos conectada");
});

// Si la conexión falla
connection.on("error", (err) => {
  console.log("Error en la conexion de la Base de datos:", err);
});
