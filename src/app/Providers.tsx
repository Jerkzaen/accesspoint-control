"use client";
// Importar los modulos de react necesarios para el componente de proveedor de sesion
import { SessionProvider } from "next-auth/react";

// Importar el componente de proveedor de sesion de la aplicacion de next-auth para la autenticacion de usuarios
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
