// src/components/sidebar-mobile.tsx
"use client";

import * as React from 'react';
import { SidebarItem } from "@/types/sidebar"; 
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle, 
  SheetDescription, 
  SheetTrigger,
} from "./ui/sheet"; 
import { Button } from "./ui/button"; 
import { LogOut, Menu, MoreHorizontal, Settings, X, UserCircle2, LogIn, Loader2 } from "lucide-react"; // Añadido UserCircle2, LogIn, Loader2
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarButton } from "./sidebar-button"; 
import { Separator } from "./ui/separator";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"; // Añadido AvatarImage
import { useSession, signIn, signOut } from "next-auth/react"; // Importaciones de NextAuth
import { Skeleton } from "./ui/skeleton"; // Importar Skeleton

interface SidebarMobileProps {
  sidebarItems: SidebarItem;
}

export function SidebarMobile(props: SidebarMobileProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession(); // Hook de NextAuth
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false); // Estado para controlar el Sheet

  const handleLinkClick = () => {
    setSheetOpen(false); // Cierra el sheet al hacer clic en un enlace
  };

  const handlePopoverAndSheetClose = () => {
    setPopoverOpen(false);
    setSheetOpen(false);
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="fixed top-3 left-3 z-50 sm:hidden" aria-label="Abrir menú de navegación"> 
          <Menu size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="px-3 py-4 flex flex-col w-[270px] sm:w-[300px]" // Ancho ajustado
        hideClose // Usaremos nuestro propio botón de cierre
      >
        <SheetHeader className="flex flex-row justify-between items-center space-y-0 flex-shrink-0 mb-4"> {/* Añadido mb-4 */}
          <SheetTitle className="text-lg font-semibold text-foreground mx-3">
            AccessPoint Control
          </SheetTitle>
          <SheetDescription className="sr-only">
            Menú principal de navegación y opciones de la aplicación.
          </SheetDescription>
          <Button onClick={() => setSheetOpen(false)} className="h-7 w-7 p-0" variant="ghost" aria-label="Cerrar menú">
            <X size={15} />
          </Button>
        </SheetHeader>
        
        <div className="flex-grow overflow-y-auto"> {/* Eliminado py-5, el padding ya está en SheetContent */}
          <div className="flex flex-col w-full gap-1">
            {props.sidebarItems.links.map((link, idx) => (
              // SheetClose ya no es necesario alrededor de cada Link si usamos setSheetOpen(false) en el Popover y en los links
              <Link 
                key={idx} 
                href={link.href} 
                onClick={handleLinkClick} // Cierra el sheet al hacer clic
                className="block rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none text-left"
              > 
                <SidebarButton
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  icon={link.icon}
                  className="w-full text-sm" // Tamaño de texto ajustado
                >
                  {link.label}
                </SidebarButton>
              </Link>
            ))}
            {status === "authenticated" && props.sidebarItems.extras && (
                // SheetClose ya no es necesario
                 <div>{props.sidebarItems.extras}</div> // Envolver extras en un div o fragmento si es necesario
            )}
          </div>
        </div>

        <div className="mt-auto flex-shrink-0"> 
          <Separator className="my-3" /> 
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="w-full justify-start rounded-md h-10 text-sm" aria-label="Abrir opciones de usuario">
                <div className="flex justify-between items-center w-full">
                  <div className="flex gap-2 items-center truncate">
                    {status === "loading" && (
                      <>
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </>
                    )}
                    {status === "authenticated" && session?.user && (
                      <>
                        <Avatar className="h-6 w-6">
                          {session.user.image && <AvatarImage src={session.user.image} alt={session.user.name || "User"} />}
                          <AvatarFallback className="text-xs">
                            {session.user.name ? session.user.name.charAt(0).toUpperCase() : (session.user.email ? session.user.email.charAt(0).toUpperCase() : 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate" title={session.user.name || session.user.email || ""}>
                          {session.user.name || session.user.email}
                        </span>
                      </>
                    )}
                    {status === "unauthenticated" && (
                       <>
                        <UserCircle2 className="h-5 w-5 mr-1 flex-shrink-0" /> 
                        <span>Usuario</span>
                       </>
                    )}
                  </div>
                  <MoreHorizontal size={20} className="flex-shrink-0" />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[calc(100%-1.5rem)] max-w-[280px] p-2 mb-2" // Ancho ajustado para que quepa mejor, y p-2
              side="top" 
              align="start" 
              sideOffset={5}
            >
              {status === "loading" && (
                <div className="p-2 text-sm text-muted-foreground flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2"/>
                  Cargando...
                </div>
              )}
              {status === "authenticated" && session?.user && (
                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Conectado como: <strong className="block truncate font-medium" title={session.user.email || ""}>{session.user.email}</strong>
                  </div>
                  <Separator />
                  {/* <Link href="/profile" onClick={handlePopoverAndSheetClose}>
                    <SidebarButton size="sm" icon={Settings} className="w-full text-xs font-normal">
                      Mi Perfil / Config.
                    </SidebarButton>
                  </Link> */}
                  <SidebarButton
                    onClick={() => {
                      signOut({ callbackUrl: "/auth/signin" });
                      handlePopoverAndSheetClose();
                    }}
                    size="sm"
                    icon={LogOut}
                    className="w-full text-xs font-normal text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                  >
                    Cerrar Sesión
                  </SidebarButton>
                </div>
              )}
              {status === "unauthenticated" && (
                <SidebarButton
                  onClick={() => {
                    signIn("google", { callbackUrl: "/tickets/dashboard" });
                    handlePopoverAndSheetClose();
                  }}
                  size="sm"
                  icon={LogIn} 
                  className="w-full text-sm font-medium"
                >
                  Iniciar Sesión con Google
                </SidebarButton>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </SheetContent> 
    </Sheet> 
  );
}
