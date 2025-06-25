// src/app/api/auth/[...nextauth]/route.ts

// Importar NextAuth y sus tipos
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth"; // Importar el tipo de opciones
// Importar proveedores
import GoogleProvider from "next-auth/providers/google";
// Importar adaptador de Prisma
import { PrismaAdapter } from "@next-auth/prisma-adapter";
// Importar la instancia centralizada de Prisma Client
import { prisma } from "@/lib/prisma";
// Importar el enum RoleUsuario (si es necesario para tipado interno)
import { RoleUsuario } from "@prisma/client";
import { NextResponse } from "next/server"; // Importar NextResponse para respuestas de fallback

// Asegúrate de que estas variables de entorno estén configuradas
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET; // Asegurarse de tener el SECRET

// Verifica que las credenciales de Google y el secreto de NextAuth existan
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables. Authentication via Google will not work.');
}
if (!NEXTAUTH_SECRET) {
  console.error('Missing NEXTAUTH_SECRET environment variable. NextAuth will not work securely.');
}


// Opciones de autenticación
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma), // Pasa la instancia centralizada de prisma al adaptador
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID!, // Usa '!' para asegurar a TypeScript que no es null/undefined
      clientSecret: GOOGLE_CLIENT_SECRET!, // Usa '!' para asegurar a TypeScript que no es null/undefined
    }),
    // Puedes añadir otros proveedores aquí
  ],
  session: {
    strategy: "jwt", // Usar JWT para las sesiones
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as any).rol; // Castea a 'any' si el tipo 'User' de NextAuth no tiene 'rol' por defecto
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).rol = token.rol;
      }
      return session;
    },
  },
  secret: NEXTAUTH_SECRET, // Usar la variable de entorno directamente
  debug: process.env.NODE_ENV === 'development', // Habilita el debug en desarrollo
  pages: {
    signIn: "/auth/signin", // Ruta a tu página de inicio de sesión personalizada
  },
};

// CORRECCIÓN FINALÍSIMA: Exportar los handlers de forma más robusta con un fallback.
// Si NextAuth(authOptions) devuelve undefined (lo que parece estar sucediendo en tu entorno),
// proporcionamos handlers de respaldo para evitar el TypeError.
let handlers: { GET: any; POST: any; };
try {
  const nextAuthResult = NextAuth(authOptions);
  if (nextAuthResult && nextAuthResult.handlers) {
    handlers = nextAuthResult.handlers;
  } else {
    // Si nextAuthResult o .handlers es undefined, creamos handlers de fallback
    console.error("NextAuth(authOptions) did not return expected handlers. Using fallback handlers.");
    const fallbackMessage = "Error de autenticación: El servidor no pudo inicializar el servicio de autenticación.";
    handlers = {
      GET: async () => NextResponse.json({ message: fallbackMessage }, { status: 500 }),
      POST: async () => NextResponse.json({ message: fallbackMessage }, { status: 500 }),
    };
  }
} catch (e) {
  console.error("Error during NextAuth initialization. Using fallback handlers.", e);
  const fallbackMessage = "Error de autenticación: Fallo crítico en la inicialización.";
  handlers = {
    GET: async () => NextResponse.json({ message: fallbackMessage }, { status: 500 }),
    POST: async () => NextResponse.json({ message: fallbackMessage }, { status: 500 }),
  };
}


export const GET = handlers.GET; // Exportamos GET desde handlers
export const POST = handlers.POST; // Exportamos POST desde handlers
