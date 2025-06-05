// Ruta: src/middleware.ts (en la raíz de src/ o del proyecto)

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // `withAuth` mejora tu `NextResponse` para incluir el token del usuario.
  // Puedes dejar esta función middleware vacía si solo quieres el comportamiento 
  // predeterminado de redirección que maneja `withAuth` basado en el callback `authorized`.
  function middleware(req) {
    // El token decodificado del usuario está disponible en: req.nextauth.token
    // console.log("Token en middleware:", req.nextauth.token);

    // Aquí es donde puedes añadir lógica de autorización más granular basada en roles,
    // una vez que la autenticación básica esté funcionando.
    // Por ejemplo:
    // const { pathname } = req.nextUrl;
    // const userRole = (req.nextauth.token as any)?.rol; // Accede al rol desde el token

    // if (pathname.startsWith("/admin-dashboard") && userRole !== "ADMIN") {
    //   return NextResponse.redirect(new URL("/acceso-denegado", req.url));
    // }
    // if (pathname.startsWith("/gestion-equipos") && !["ADMIN", "TECNICO"].includes(userRole)) {
    //   return NextResponse.redirect(new URL("/acceso-denegado", req.url));
    // }

    // Si se llega hasta aquí, y el usuario está autenticado (verificado por `authorized` callback),
    // se permite el acceso a la ruta solicitada.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Esta función determina si el usuario está "autorizado".
        // Si `token` existe (es decir, el usuario ha iniciado sesión y tiene un token válido),
        // entonces devuelve `true` y se permite el acceso (o se ejecuta la lógica de la función `middleware` de arriba).
        // Si `token` es `null` (usuario no autenticado), devuelve `false`.
        // Cuando devuelve `false`, `withAuth` redirige automáticamente al usuario
        // a la página de inicio de sesión definida en la opción `pages.signIn`.
        return !!token;
      },
    },
    pages: {
      signIn: "/auth/signin", // Asegúrate que esta sea la ruta a tu página de login personalizada
      // error: "/auth/error", // Opcional: si tienes una página para errores de autenticación
    },
  }
);

// El `matcher` define a qué rutas se aplicará este middleware.
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de solicitud excepto aquellas que comienzan con:
     * - api/auth (rutas de API de NextAuth para el proceso de autenticación)
     * - _next/static (archivos estáticos de Next.js como JS, CSS)
     * - _next/image (archivos de optimización de imágenes de Next.js)
     * - favicon.ico (archivo de favicon)
     * - /auth/signin (tu página de inicio de sesión, para evitar bucles de redirección)
     * - /images (u otras carpetas públicas que quieras excluir explícitamente)
     *
     * IMPORTANTE sobre la página de inicio ("/"):
     * Con el matcher actual, la página de inicio ("/") ESTARÁ PROTEGIDA.
     * Si quieres que tu página de inicio sea pública (ej. una landing page),
     * necesitas añadirla a las exclusiones del matcher. Por ejemplo:
     * "/((?!api/auth|_next/static|_next/image|favicon.ico|auth/signin|$).*)", 
     * (el '$' al final de las exclusiones en el negative lookahead se refiere a la ruta raíz exacta)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|auth/signin|images).*)",
    // Esta expresión regular protege todas las rutas EXCEPTO:
    // - /api/auth/...
    // - /_next/static/...
    // - /_next/image/...
    // - /favicon.ico
    // - /auth/signin
    // - /images/... (si tienes imágenes públicas en /public/images que deben ser accesibles)
    // Si tu página de inicio "/" debe ser pública, el matcher necesitará un ajuste.
  ],
};
