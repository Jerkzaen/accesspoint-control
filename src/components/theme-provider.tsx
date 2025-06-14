// RUTA: src/components/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// Ya no necesitamos la siguiente línea que causaba el error:
// import type { ThemeProviderProps } from "next-themes/dist/types"

// ======================= INICIO DE LA CORRECCIÓN =======================
// Obtenemos los 'props' de una manera segura y estándar de React,
// en lugar de depender de rutas internas de la librería.
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>
// ======================== FIN DE LA CORRECCIÓN =========================

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
