// Ruta: src/middleware.ts (DEBE estar en la raíz de src/ o del proyecto)

import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

console.log("--- Middleware Cargado ---"); // Para saber si el archivo se carga

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    console.log(`[Middleware] Ruta solicitada: ${pathname}`);
    console.log("[Middleware] Token:", token ? "Presente" : "Ausente");
    if(token) {
      console.log("[Middleware] Rol del token:", (token as any)?.rol);
    }

    // Lógica de roles (opcional, la activaremos después si es necesario)
    // const userRole = (token as any)?.rol;
    // if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
    //   console.log("[Middleware] Acceso denegado a /admin para rol:", userRole);
    //   return NextResponse.redirect(new URL("/auth/acceso-denegado", req.url));
    // }

    // Si el token está presente (verificado por el callback 'authorized'),
    // y no hay otra lógica de redirección específica aquí, permite el acceso.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        const isAuthorized = !!token;
        console.log(`[Middleware Callback - authorized] Path: ${pathname}, Token presente: ${!!token}, Autorizado: ${isAuthorized}`);
        
        // Si el usuario no está autorizado (sin token) Y NO está ya en una ruta pública permitida,
        // entonces la redirección a la página de signIn ocurrirá automáticamente por withAuth.
        // El callback `authorized` solo necesita devolver true si el acceso debe permitirse
        // a la ruta actual bajo las condiciones de withAuth.
        return isAuthorized;
      },
    },
    pages: {
      signIn: "/auth/signin", // Tu página de login personalizada
      // error: "/auth/error", // Opcional
    },
  }
);

export const config = {
  matcher: [
    /*
     * Coincide con TODAS las rutas excepto aquellas explícitamente excluidas.
     * Esto es crucial para asegurar que todo esté protegido por defecto.
     *
     * EXCLUSIONES:
     * - /api/auth/... (Rutas de API de NextAuth)
     * - /_next/static/... (Archivos estáticos de Next.js)
     * - /_next/image/... (Optimización de imágenes de Next.js)
     * - /favicon.ico
     * - /auth/signin (Tu página de inicio de sesión)
     * - /images/... (Carpeta pública de imágenes)
     * - CUALQUIER OTRO archivo en /public (ej. .svg, .png, .jpg en la raíz de /public)
     * Para excluir todos los archivos con extensiones comunes de la carpeta public,
     * puedes añadir un lookahead más general para archivos con puntos.
     * (?!.*\..+$) - esto es un poco agresivo, es mejor listar explícitamente.
     *
     * Si tu PÁGINA DE INICIO (/) debe ser pública, añádela a las exclusiones:
     * ej: "/((?!api/auth|_next/static|_next/image|favicon.ico|auth/signin|images|$).*)", (el '$' excluye la raíz exacta)
     */
    "/((?!api/auth/|_next/static/|_next/image/|favicon.ico|auth/signin|images/).*)",
  ],
};
