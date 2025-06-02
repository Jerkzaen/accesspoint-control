// src/app/layout.tsx
"use client"; // Necesario para usar hooks como useMediaQuery

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
// import type { Metadata } from "next"; // Metadata se maneja diferente con "use client"
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import Sidebar from "@/components/sidebar";
import { Providers } from "@/app/Providers";
import Header from "@/components/Header";
import { ClientOnly } from "@/components/ClientOnly";
import { useMediaQuery } from "usehooks-ts"; // Importar el hook
import { useEffect, useState } from "react"; // Para manejar el estado de montaje

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sidebarDesktopWidth = "270px";
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Establecer el título dinámicamente si es necesario
    document.title = "AccessPoint Control";
  }, []);

  const mainContentMarginLeft = mounted && isDesktop ? sidebarDesktopWidth : "0px";

  return (
    <html lang="es" suppressHydrationWarning className="h-full">
      <head>
        <meta name="description" content="Control de AccessPoint" />
        {/* Es buena práctica tener un title estático aquí también por si el document.title tarda */}
        <title>AccessPoint Control</title>
      </head>
      <body
        className={cn(
          "h-full bg-background font-sans antialiased overflow-hidden",
          fontSans.variable
        )}
      >
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
          >
            <ClientOnly 
              fallback={null} // MODIFICADO: Fallback cambiado a null
            >
              {/* El div que antes era el fallback ya no está aquí.
                  ClientOnly renderizará null (nada) o sus children. */}
              <div className="flex h-full" suppressHydrationWarning> {/* suppressHydrationWarning aquí por si Next.js se queja de este div durante la hidratación */}
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
          </ThemeProvider>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
