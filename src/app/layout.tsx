// src/app/layout.tsx
"use client"; // Necesario para usar hooks como useMediaQuery

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
// ThemeProvider se importará y usará dentro de Providers.tsx
import Sidebar from "@/components/sidebar";
import { Providers } from "@/app/Providers"; // Este componente contendrá SessionProvider y ThemeProvider
import Header from "@/components/Header";
import { ClientOnly } from "@/components/ClientOnly";
import { useMediaQuery } from "usehooks-ts"; 
import { useEffect, useState } from "react"; 

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

// export const metadata: Metadata = { // Si quieres re-habilitar metadata estática, quita "use client" o usa generateMetadata
//   title: "AccessPoint Control",
//   description: "Control de AccessPoint",
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
        <meta name="description" content="Control de AccessPoint" />
        <title>AccessPoint Control</title>
      </head>
      <body
        className={cn(
          "h-full bg-background font-sans antialiased overflow-hidden",
          fontSans.variable
        )}
      >
        <Providers> {/* Providers.tsx ahora envuelve con SessionProvider y ThemeProvider */}
          <ClientOnly fallback={null}>
            <div className="flex h-full" suppressHydrationWarning>
              <Sidebar />
              <div
                className="flex-1 flex flex-col h-full transition-all duration-300 ease-in-out"
                style={{ marginLeft: mainContentMarginLeft }} 
              >
                <Header />
                {/* Considera añadir un padding general aquí si todas las páginas lo necesitan */}
                <main className="flex-grow overflow-y-auto"> 
                  {children} {/* Aquí se renderiza el contenido de tus páginas */}
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
