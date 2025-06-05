// src/components/SidebarDesktop.tsx
"use client"; // Necesario para useSession y usePathname

import { SidebarButton } from "./sidebar-button";
import { SidebarItem } from "@/types/sidebar";
import Link from "next/link";
import { Separator } from "./ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"; // Importar AvatarImage
import { LogOut, MoreHorizontal, Settings, LogIn, UserCircle2 } from "lucide-react"; // Importar LogIn y UserCircle2
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react"; // Importar hooks y funciones de NextAuth
import { Skeleton } from "./ui/skeleton"; // Importar Skeleton para el estado de carga

interface SidebarDesktopProps {
  sidebarItems: SidebarItem;
}

export function SidebarDesktop(props: SidebarDesktopProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession(); // Obtener datos de la sesión y estado

  // const userEmailPlaceholder = "usuario@ejemplo.com"; // Ya no se necesita si usamos la sesión

  return (
    <aside className="w-[270px] max-w-xs h-screen fixed left-0 top-0 z-40 border-r bg-background flex flex-col">
      <div className="h-full px-3 py-4 flex flex-col">
        <div className="flex-shrink-0">
          <h3 className="mx-3 text-lg font-semibold text-foreground">
            AccessPoint Control
          </h3>
          <div className="mt-5">
            <div className="flex flex-col gap-1 w-full">
              {props.sidebarItems.links.map((link, index) => (
                <Link key={index} href={link.href}>
                  <SidebarButton
                    variant={pathname === link.href ? "secondary" : "ghost"}
                    icon={link.icon}
                    className="w-full"
                  >
                    {link.label}
                  </SidebarButton>
                </Link>
              ))}
              {/* Renderizar extras solo si el usuario está autenticado y los extras existen */}
              {status === "authenticated" && props.sidebarItems.extras}
            </div>
          </div>
        </div>

        <div className="mt-auto w-full pt-4">
          <Separator className="mb-3" />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="w-full justify-start rounded-full h-10"> {/* Altura fija para consistencia */}
                <div className="flex justify-between items-center w-full">
                  <div className="flex gap-2 items-center truncate"> {/* truncate para nombres largos */}
                    {status === "loading" && (
                      <>
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </>
                    )}
                    {status === "authenticated" && session?.user && (
                      <>
                        <Avatar className="h-6 w-6"> {/* Tamaño de avatar ajustado */}
                          {session.user.image && <AvatarImage src={session.user.image} alt={session.user.name || "User"} />}
                          <AvatarFallback className="text-xs">
                            {session.user.name ? session.user.name.charAt(0).toUpperCase() : (session.user.email ? session.user.email.charAt(0).toUpperCase() : 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate" title={session.user.name || session.user.email || ""}> {/* title para tooltip en hover */}
                          {session.user.name || session.user.email}
                        </span>
                      </>
                    )}
                    {status === "unauthenticated" && (
                       <>
                        <UserCircle2 className="h-5 w-5 mr-1" /> 
                        <span className="text-sm">Usuario</span>
                       </>
                    )}
                  </div>
                  <MoreHorizontal size={20} />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="mb-2 w-56 p-2 rounded-lg" sideOffset={5}> {/* Ajustado padding y sideOffset */}
              {status === "authenticated" && session?.user && (
                <div className="space-y-1">
                   <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Conectado como: <strong className="block truncate" title={session.user.email || ""}>{session.user.email}</strong>
                  </div>
                  <Separator />
                  <Link href="/profile"> {/* Enlace a perfil si tienes una página de perfil */}
                    <SidebarButton size="sm" icon={Settings} className="w-full text-xs">
                      Mi Perfil / Config.
                    </SidebarButton>
                  </Link>
                  <SidebarButton
                    onClick={() => signOut()}
                    size="sm"
                    icon={LogOut}
                    className="w-full text-xs"
                  >
                    Cerrar Sesión
                  </SidebarButton>
                </div>
              )}
              {status === "unauthenticated" && (
                <SidebarButton
                  onClick={() => signIn("google")}
                  size="sm"
                  icon={LogIn} // Icono de LogIn
                  className="w-full text-sm" // texto un poco más grande para el botón de login
                >
                  Iniciar Sesión con Google
                </SidebarButton>
              )}
               {status === "loading" && (
                 <div className="p-2 text-sm text-muted-foreground">Cargando...</div>
               )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </aside>
  );
}
