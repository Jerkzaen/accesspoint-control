//src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
// Asegúrate que la ruta a tu cliente Prisma sea correcta.
// Si tienes un archivo centralizado para prisma (ej. @/lib/prisma), úsalo:
import { prisma } from "@/lib/prisma"; 
// Si no, y lo instancias aquí:

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    // El CredentialsProvider que tenías antes lo he comentado.
    // Si solo usarás Google para los técnicos, no es necesario.
    // Si lo necesitas para otros usuarios, podemos adaptarlo luego para que funcione con Prisma.
    /*
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Aquí iría la lógica para validar credenciales contra tu BD Prisma
        // Por ahora, lo dejamos comentado.
        // const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        // if (user && bcrypt.compareSync(credentials.password, user.passwordHash)) {
        //   return { id: user.id, name: user.name, email: user.email, rol: user.rol };
        // }
        return null; 
      }
    }),
    */
  ],
  session: {
    strategy: "jwt", // Recomendado para sesiones con OAuth
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Al iniciar sesión o al crear el usuario (cuando 'user' está presente),
      // se añade el 'id' y 'rol' del usuario al token JWT.
      if (user) {
        token.id = user.id;
        // El objeto 'user' aquí es el que proviene del adaptador de Prisma
        // y debería incluir los campos de tu modelo 'User', incluido 'rol'.
        token.rol = (user as any).rol; // Casteamos a 'any' por si el tipo 'User' de NextAuth no lo incluye por defecto.
      }
      return token;
    },
    async session({ session, token, user }) {
      // Esta información se pasa del token JWT a la sesión del cliente.
      // Así podrás acceder a session.user.id y session.user.rol en tus componentes.
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).rol = token.rol;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Opcional: Descomenta para depuración en desarrollo
  debug: process.env.NODE_ENV === 'development', 
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };