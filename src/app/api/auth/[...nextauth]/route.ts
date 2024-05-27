//importamos nextauth para poder usarlo en nuestra aplicacion
import NextAuth from "next-auth";
//importamos el provider de google para poder usarlo en nuestra aplicacion
import GoogleProvider from "next-auth/providers/google";

//  exportamos la funcion de nextauth y le pasamos un objeto con los providers que vamos a usar
NextAuth({
  providers: [GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  })],
});
