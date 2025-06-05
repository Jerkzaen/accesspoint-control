// src/app/layout.tsx
"use client"; 

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/sidebar";
import { Providers } from "@/app/Providers"; 
import Header from "@/components/Header";
import { ClientOnly } from "@/components/ClientOnly"; 
import { useMediaQuery } from "usehooks-ts"; 
import { useEffect, useState } from "react"; 
import { usePathname } from "next/navigation"; // Importar usePathname

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname(); // Obtener la ruta actual
  const sidebarDesktopWidth = "270px";
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.title = "AccessPoint Control";
  }, []);

  const mainContentMarginLeft = mounted && isDesktop ? sidebarDesktopWidth : "0px";

  // Determinar si estamos en la página de autenticación
  const isAuthPage = pathname === "/auth/signin";

  return (
    <html lang="es" suppressHydrationWarning className="h-full">
      <head>
        <meta name="description" content="Control de AccessPoint y Tickets" />
        <title>AccessPoint Control</title>
      </head>
      <body
        className={cn(
          "h-full bg-background font-sans antialiased", // overflow-hidden se maneja condicionalmente
          isAuthPage ? "overflow-auto" : "overflow-hidden", // Permitir scroll en auth page si es necesario, oculto en el layout principal
          fontSans.variable
        )}
      >
        <Providers> {/* Providers envuelve a SessionProvider y ThemeProvider */}
          {isAuthPage ? (
            // Si es la página de autenticación, solo renderizar los hijos (el contenido de SignInPage)
            // ClientOnly podría no ser estrictamente necesario aquí si SignInPage ya es "use client"
            // pero lo mantenemos por consistencia si SignInPage hace uso de hooks que lo requieran.
            <ClientOnly fallback={<div>Cargando página de inicio de sesión...</div>}> 
              {children}
            </ClientOnly>
          ) : (
            // Para todas las demás páginas, renderizar el layout completo
            <ClientOnly fallback={null}> {/* O un loader más completo para el layout principal */}
              <div className="flex h-full" suppressHydrationWarning>
                <Sidebar />
                <div
                  className="flex-1 flex flex-col h-full transition-all duration-300 ease-in-out"
                  style={{ marginLeft: mainContentMarginLeft }} 
                >
                  <Header />
                  <main className="flex-grow overflow-y-auto">
                    {children}
                  </main>
                </div>
              </div>
            </ClientOnly>
          )}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
