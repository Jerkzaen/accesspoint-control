/// src/middleware.ts

import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // Esta función middleware se ejecuta DESPUÉS de que el callback `authorized`
  // haya determinado que el usuario está autenticado (es decir, `authorized` devolvió true).
  // Aquí puedes implementar lógica adicional basada en el token del usuario, como la autorización por roles.
  function middleware(req: NextRequestWithAuth) {
    // El token decodificado del usuario (incluyendo el 'id' y 'rol' que añadimos en los callbacks de NextAuth)
    // está disponible en: req.nextauth.token
    // const userRole = (req.nextauth.token as any)?.rol;

    // Ejemplo de protección basada en roles (descomentar y adaptar si es necesario):
    // if (req.nextUrl.pathname.startsWith("/admin") && userRole !== "ADMIN") {
    //   // Redirige a una página de "acceso denegado" o a la página principal
    //   return NextResponse.redirect(new URL("/acceso-denegado", req.url));
    // }

    // Si no hay ninguna lógica de autorización específica aquí que bloquee el acceso,
    // permite que la solicitud continúe.
    return NextResponse.next();
  },
  {
    callbacks: {
      // Este callback se ejecuta ANTES que la función `middleware` de arriba.
      // Su propósito es determinar si el usuario está "autorizado" para acceder
      // a las rutas cubiertas por el `matcher`.
      authorized: ({ req, token }) => {
        // Si `token` existe (es decir, el usuario ha iniciado sesión y tiene un token válido),
        // entonces el usuario se considera autorizado para las rutas protegidas.
        // Si `token` es `null` (usuario no autenticado), devuelve `false`.
        // Cuando `authorized` devuelve `false`, `withAuth` redirige automáticamente
        // al usuario a la página de inicio de sesión especificada en `pages.signIn`.
        return !!token;
      },
    },
    pages: {
      // Especifica la ruta a tu página de inicio de sesión personalizada.
      // `withAuth` redirigirá aquí si el callback `authorized` devuelve `false`.
      signIn: "/auth/signin",
      // Opcional: puedes definir una página para errores de autenticación.
      // error: "/auth/error", 
    },
  }
);

// El `config.matcher` define a qué rutas se aplicará este middleware de autenticación.
export const config = {
  matcher: [
    /*
     * Esta expresión regular coincide con TODAS las rutas de solicitud,
     * EXCEPTO aquellas que comienzan con:
     * - api/auth/ (rutas de API de NextAuth para el proceso de autenticación, ej. el callback de Google)
     * - _next/static/ (archivos estáticos generados por Next.js como JS, CSS)
     * - _next/image/ (rutas para la optimización de imágenes de Next.js)
     * - favicon.ico (el archivo del favicon)
     * - /auth/signin (TU página de inicio de sesión personalizada, para evitar bucles de redirección)
     * - /images/ (u otras carpetas que tengas en /public y quieras que sean siempre accesibles)
     *
     * IMPORTANTE sobre la página de inicio ("/"):
     * Con el matcher actual, la página de inicio ("/") ESTARÁ PROTEGIDA.
     * Si quieres que tu página de inicio sea pública (ej. una landing page que no requiera login),
     * necesitarás añadirla explícitamente a las exclusiones. Una forma es:
     * "/((?!api/auth/|_next/static/|_next/image/|favicon.ico|auth/signin|images|$).*)",
     * (el '$' al final de las exclusiones en el "negative lookahead" se refiere a la ruta raíz exacta)
     */
    "/((?!api/auth/|_next/static/|_next/image/|favicon.ico|auth/signin|images/).*)",
  ],
};
