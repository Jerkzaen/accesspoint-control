// src/app/layout.tsx
"use client"; 

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
// ThemeProvider ya no se importa aquí directamente, se maneja dentro de Providers.tsx
import Sidebar from "@/components/sidebar";
import { Providers } from "@/app/Providers"; // Este componente ahora envuelve a ambos providers
import Header from "@/components/Header";
import { ClientOnly } from "@/components/ClientOnly"; // Asumo que lo sigues usando
import { useMediaQuery } from "usehooks-ts"; 
import { useEffect, useState } from "react"; 

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Si necesitas metadata y tienes "use client", considera usar generateMetadata
// o definirla estáticamente y asegurar que no haya conflictos.
// export const metadata = {
//   title: "AccessPoint Control",
//   description: "Control de AccessPoint y Tickets",
// };

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
    document.title = "AccessPoint Control";
  }, []);

  const mainContentMarginLeft = mounted && isDesktop ? sidebarDesktopWidth : "0px";

  return (
    <html lang="es" suppressHydrationWarning className="h-full">
      <head>
        <meta name="description" content="Control de AccessPoint y Tickets" />
        <title>AccessPoint Control</title>
      </head>
      <body
        className={cn(
          "h-full bg-background font-sans antialiased overflow-hidden",
          fontSans.variable
        )}
      >
        <Providers> {/* Providers ahora envuelve a SessionProvider y ThemeProvider */}
          <ClientOnly fallback={null}>
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
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
