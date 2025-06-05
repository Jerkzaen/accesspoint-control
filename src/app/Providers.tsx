// src/app/Providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider"; // Asumo que ya tenías ThemeProvider

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/* Si ThemeProvider envuelve a SessionProvider o viceversa puede depender de si el tema necesita
          acceder a la sesión, pero generalmente este orden funciona bien. */}
      <ThemeProvider
        attribute="class"
        defaultTheme="light" // o el tema que prefieras
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
