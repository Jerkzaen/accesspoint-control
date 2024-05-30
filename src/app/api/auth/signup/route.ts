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
  console.log(fullname, email, password);
  // Validamos que los datos no estén vacíos
  if (!password || password.length < 6)
    return NextResponse.json(
      { message: " La contraseña debe contener al menos 6 caracteres " },
      { status: 400 }
    );
  // Validamos que el correo no esté registrado en la base de datos
  const userFound = await User.findOne({ email });
  if (userFound)
    return NextResponse.json(
      { message: "El correo ya esta registrado" },
      { status: 409 }
    );
  try {
    // Conectamos a la base de datos
    await connectDB();
    // Encriptamos la contraseña con bcrypt y un factor de coste de 12 (por defecto)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Creamos un nuevo usuario con los datos recibidos y la contraseña encriptada
    const user = new User({
      email,
      fullname,
      password: hashedPassword,
    });
    const savedUser = await user.save();
    console.log(savedUser);
  } catch (error) {
    console.log(error);
    return NextResponse.error();
  }
}
