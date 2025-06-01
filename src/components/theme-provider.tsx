"use client"
 
import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
// import { SessionProvider } from "next-auth/react"; // Comentado temporalmente
 
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // return <SessionProvider><NextThemesProvider {...props}>{children}</NextThemesProvider></SessionProvider>; // Comentado temporalmente
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>; // Quitado SessionProvider
}
