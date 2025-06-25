// RUTA: /next-auth.d.ts (en la raíz del proyecto)

import { RoleUsuario } from '@prisma/client';
import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Extiende la sesión para incluir nuestras propiedades personalizadas.
   */
  interface Session {
    user: {
      id: string;
      role: RoleUsuario;
    } & DefaultSession['user'];
  }

  /**
   * Extiende el usuario para incluir el rol.
   */
  interface User extends DefaultUser {
    role: RoleUsuario;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extiende el token JWT para incluir el rol.
   */
  interface JWT extends DefaultJWT {
    role: RoleUsuario;
  }
}
