//src/app/auth/signin/page.tsx
"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; 
import Image from "next/image";
import { FcGoogle } from "react-icons/fc"; 
import { Loader2 } from "lucide-react"; 

// Layout simple específico para la página de login.
function SignInPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950 flex items-center justify-center p-4 sm:p-6 md:p-8 antialiased">
        {children}
      </body>
    </html>
  );
}

// Componente interno para el contenido de la página de inicio de sesión
function SignInPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/tickets/dashboard"); 
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center text-slate-700 dark:text-slate-300 min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p>Verificando sesión...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="w-full h-full bg-white dark:bg-slate-800/70 backdrop-blur-md shadow-2xl rounded-xl overflow-hidden flex flex-col md:flex-row">
        {/* Columna Izquierda: Imagen Corporativa */}
        <div className="w-full md:w-1/2 hidden md:block relative">
          <Image
            src="/images/accesspoint-login-bg.jpg" // Asegúrate que esta sea tu nueva imagen roja 1200x1600
            alt="Imagen Corporativa AccessPoint Control"
            fill // Prop moderna para llenar el contenedor
            className="object-cover object-center" // Clases para object-fit y object-position
            priority
            sizes="(min-width: 768px) 50vw, 0vw" // Prop sizes para optimización
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'; 
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent && !parent.querySelector('.image-fallback')) { 
                const fallbackDiv = document.createElement('div');
                fallbackDiv.className = "image-fallback absolute inset-0 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500";
                fallbackDiv.innerText = "Imagen no disponible";
                parent.appendChild(fallbackDiv);
              }
              console.error("Error al cargar la imagen de fondo del login.");
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-red-900/70 via-red-800/40 to-transparent flex flex-col items-start justify-end p-8 lg:p-12 text-white"> {/* Degradado ajustado a tonos rojos */}
            <h1 className="text-3xl lg:text-5xl font-bold mb-3 lg:mb-4 leading-tight shadow-sm">
              AccessPoint Control
            </h1>
            <p className="text-base lg:text-xl leading-relaxed opacity-90 shadow-sm">
              Gestión centralizada y eficiente para tus tickets de soporte y equipos.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Card de Inicio de Sesión */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center items-center">
          <Card className="w-full max-w-sm border-0 md:border shadow-none md:shadow-lg bg-transparent md:bg-card">
            <CardHeader className="text-center">
              <div className="mb-4 flex justify-center">
                {/* Icono SVG ajustado para que use el color primario (rojo) */}
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400 h-12 w-12"><path d="M6.5 10.5c-.78-.78-.78-2.05 0-2.83s2.05-.78 2.83 0"/><path d="M14.5 10.5c.78.78.78 2.05 0 2.83s-2.05-.78-2.83 0"/><path d="M9.33 7.17c-.73.73-1.11 1.68-1.23 2.64"/><path d="M15.88 13.05c-.42.6-.99 1.1-1.66 1.44"/><path d="m12 22 4.24-4.24c.98-.98.98-2.56 0-3.54s-2.56-.98-3.54 0L12 14.94V22Z"/><path d="m12 22-4.24-4.24c.98-.98-.98-2.56 0-3.54s2.56-.98 3.54 0L12 14.94Z"/><path d="M3.23 15.27C2.34 14.2 2 12.88 2 11.5A5.5 5.5 0 0 1 7.5 6c1.38 0 2.7.34 3.77 1.23"/><path d="M12.77 1.23C13.84.34 15.16 0 16.5 0A5.5 5.5 0 0 1 22 5.5c0 1.38-.34 2.7-1.23 3.77"/></svg>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
                Bienvenido
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 pt-1">
                Inicia sesión para acceder al panel de control.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button
                onClick={() => signIn("google", { callbackUrl: "/tickets/dashboard" })}
                variant="outline"
                className="w-full h-11 text-sm sm:text-base font-medium bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-500 focus-visible:ring-red-500" // ring ajustado a rojo
              >
                <FcGoogle className="mr-2.5 h-5 w-5" />
                Continuar con Google
              </Button>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-6 text-center">
                Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
              </p>
            </CardContent>
          </Card>
           <p className="text-xs text-slate-500 dark:text-slate-400 mt-8 text-center">
            &copy; {new Date().getFullYear()} AccessPoint Control.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-slate-700 dark:text-slate-300 min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin mb-4" />
      <p>Redirigiendo...</p>
    </div>
  );
}

export default function SignInPageWrapper() {
  return <SignInPageContent />;
}
