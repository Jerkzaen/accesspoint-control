        import { NextRequest, NextResponse } from 'next/server'; // Descomentar si necesitas middleware personalizado

        // Ya que NextAuth se eliminó, este middleware no debe hacer referencia a él.
        // Si no necesitas ningún middleware, puedes eliminar este archivo o dejarlo vacío.
        // Si necesitas otro tipo de lógica de middleware, impleméntala aquí.

        export function middleware(request: NextRequest) {
          // Ejemplo: Redireccionar o modificar la solicitud si es necesario.
          // Por ahora, simplemente continuamos.
          // return NextResponse.next();
          return undefined; // No hacer nada si no hay lógica de middleware
        }

        // Si no hay middleware, un matcher vacío o comentar esto.
        export const config = {
          matcher: [
            /* '/ruta-protegida/:path*', */
          ], // Deja esto vacío o comenta si no hay rutas que proteger
        };
        