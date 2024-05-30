// Importamos NextResponse para enviar la respuesta al cliente
import { NextResponse } from "next/server";
//importamos el modelo de usuario para hacer la consulta
import User from "@/models/user";
// importamos bcrypt para encriptar la contraseña
import bcrypt from "bcryptjs";
// importamos la función connectDB para conectarnos a la base de datos
import { connectDB } from "@/utils/mongoose";

// Función POST para registrar un usuario en la base de datos
export async function POST(request: Request) {
  const { fullname, email, password } = await request.json();
  // Capturamos los datos del cuerpo de la petición (nombre, correo)
  console.log("Capturando datos para nuevo usuario; ",fullname, email);
  // Validamos que los datos no estén vacíos
  if (!password || password.length < 6)
    // Si la contraseña está vacía o tiene menos de 6 caracteres, enviamos un mensaje de error al cliente con un estado 400 (bad request)
    return NextResponse.json(
      { message: " La contraseña debe contener al menos 6 caracteres " },
      { status: 400 }
    );
  // Validamos que el correo no esté registrado en la base de datos
  try {
      // Conectamos a la base de datos  
    await connectDB();
    // Buscamos un usuario con el correo recibido en la base de datos
    const userFound = await User.findOne({ email });
    // Si encontramos un usuario con el correo recibido, enviamos un mensaje de error al cliente con un estado 409 (conflict)
    if (userFound)
      // Si encontramos un usuario con el correo recibido, enviamos un mensaje de error al cliente con un estado 409 (conflict)
      return NextResponse.json(
        // Enviamos un mensaje de error al cliente con un estado 409 (conflict) si el correo ya está registrado en la base de datos
        { message: "El correo ya esta registrado" },
        { status: 409 }
      );
    // Encriptamos la contraseña con bcrypt y un factor de coste de 12 (por defecto)  
    const hashedPassword = await bcrypt.hash(password, 12);
    // Creamos un nuevo usuario con los datos recibidos y la contraseña encriptada  
    const user = new User({
      email,
      fullname,
      password: hashedPassword,
    });
    // Guardamos el usuario en la base de datos y esperamos a que la operación se complete para continuar con el código   
    const savedUser = await user.save();
    // Imprimimos en consola el usuario guardado en la base de datos para depuración y seguimiento de errores en producción    
    console.log("Se registro un nuevo usuario:", savedUser);
    // Enviamos la respuesta al cliente con el usuario guardado en la base de datos y un estado 201 (creado)
    return NextResponse.json(savedUser, { status: 201 });
    // Si hay un error, enviamos un mensaje de error al cliente con un estado 400 (bad request)
  } catch (error) {
    // Imprimimos el error en consola para depuración y seguimiento de errores en producción 
    console.log(error);
    // Si hay un error, enviamos un mensaje de error al cliente con un estado 400 (bad request)
    if (error instanceof Error) {
      // Si el error es una instancia de Error, enviamos el mensaje de error al cliente
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }
  }
}
