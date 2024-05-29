//Importamos mongoose para conectarnos a la base de datos
import mongoose from "mongoose";



// -Función para conectarnos a la base de datos
export const connectDB = async () =>{
try {
  //Conectamos a la base de datos con mongoose y la URI de la base de datos
    const {connection} = await mongoose.connect(
      "mongodb+srv://AlertPlusDBA:AlertPlus2024APC@cluster0.2cnqbre.mongodb.net/apcontrol")
      //Si la conexión es exitosa, mostramos un mensaje en consola
      if (connection.readyState === 1 ) {
        console.log("Conectado a la base de datos:", connection.name)
        return Promise.resolve(true);
      }
      //Si la conexión no es exitosa, mostramos un mensaje en consola y retornamos un error
} catch (error) {
  console.log(error)
  return Promise.reject(false);
}

}
