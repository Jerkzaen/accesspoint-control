// RUTA: src/app/api/auth/[...nextauth]/route.ts (ACTUALIZADO)

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Importamos nuestra configuración centralizada

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };