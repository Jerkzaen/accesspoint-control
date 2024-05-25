//Importamos mongoose para conectarnos a la base de datos
import mongoose from "mongoose";

export async function connectDB() {
  // Conectamos a la base de datos
  await mongoose.connect(
    "mongodb+srv://AlertPlusDBA:AlertPlus2024APC@cluster0.2cnqbre.mongodb.net/"
  );

  // Si la conexión es exitosa
  mongoose.connection.on("open", () => {
    console.log("Conexión exitosa a la base de datos");
  });

  // Si la conexión falla
  mongoose.connection.on("error", (error) => {
    console.log("Error al conectarse a la base de datos", error);
  });
}
