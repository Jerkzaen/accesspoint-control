        "use client";
        // import { SessionProvider } from "next-auth/react"; // Eliminado

        export function Providers({ children }: { children: React.ReactNode }) {
          // return <SessionProvider>{children}</SessionProvider>; // Eliminado
          return <>{children}</>; // Devuelve solo children
        }
        