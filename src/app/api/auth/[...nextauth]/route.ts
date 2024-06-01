//importamos nextauth para poder usarlo en nuestra aplicacion
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
//importamos el provider de google para poder usarlo en nuestra aplicacion
import GoogleProvider from "next-auth/providers/google";

//  exportamos la funcion de nextauth y le pasamos un objeto con los providers que vamos a usar
const handler = NextAuth({

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials, req) {
      const user = { id: "1", name: "J Smith", email: "jon@smith.cl "}
       return user 
      }
    }),
  ],
  
});
export { handler as GET, handler as POST };
