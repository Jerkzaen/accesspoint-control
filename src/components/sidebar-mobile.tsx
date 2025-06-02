// src/components/sidebar-mobile.tsx
"use client";
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
import { LogOut, Menu, MoreHorizontal, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarButtonSheet as SidebarButton } from "./sidebar-button";
import { Separator } from "./ui/separator";
import { 
  Drawer, 
  DrawerContent, 
  DrawerTrigger,
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription 
} from "./ui/drawer"; 
import { Avatar, AvatarFallback } from "./ui/avatar";

interface SidebarMobileProps {
  sidebarItems: SidebarItem;
}

export function SidebarMobile(props: SidebarMobileProps) {
  const pathname = usePathname();
  const userEmailPlaceholder = "usuario@ejemplo.com";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="fixed top-3 left-3 z-50 sm:hidden" aria-label="Abrir menú de navegación"> 
          <Menu size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="px-3 py-4 flex flex-col" hideClose>
        {/* El hideClose en SheetContent es importante, ya que usamos nuestro propio SheetClose */}
        <SheetHeader className="flex flex-row justify-between items-center space-y-0 flex-shrink-0">
          <SheetTitle className="text-lg font-semibold text-foreground mx-3">
            AccessPoint Control
          </SheetTitle>
          <SheetDescription className="sr-only">
            Menú principal de navegación y opciones de la aplicación.
          </SheetDescription>
          <SheetClose asChild>
            <Button className="h-7 w-7 p-0" variant="ghost" aria-label="Cerrar menú">
              <X size={15} />
            </Button>
          </SheetClose>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto py-5">
          <div className="flex flex-col w-full gap-1">
            {props.sidebarItems.links.map((link, idx) => (
              <Link key={idx} href={link.href}>
                {/*
                  Al hacer clic en un enlace, el Sheet se cerrará automáticamente si
                  SidebarButton (que usa SheetClose) está correctamente implementado.
                  Esto debería mover el foco fuera del SheetContent.
                */}
                <SidebarButton
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  icon={link.icon}
                  className="w-full"
                >
                  {link.label}
                </SidebarButton>
              </Link>
            ))}
            {props.sidebarItems.extras}
          </div>
        </div>
        <div className="mt-auto flex-shrink-0"> 
          <Separator className="my-3" /> 
          {/*
            El problema podría estar aquí: un Drawer dentro de un Sheet.
            Cuando el Drawer se abre, el Sheet sigue "abierto" en el fondo.
            Cuando el Drawer se cierra, el foco podría intentar volver a un elemento
            dentro del Sheet que Radix considera que debería estar oculto si el Drawer
            era modal respecto al Sheet.
          */}
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="ghost" className="w-full justify-start rounded-full" aria-label="Abrir opciones de usuario">
                <div className="flex justify-between items-center w-full">
                  <div className="flex gap-2 items-center">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback>{userEmailPlaceholder.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{userEmailPlaceholder}</span>
                  </div>
                  <MoreHorizontal size={20} />
                </div>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="mb-2 p-3">
              <DrawerHeader className="pt-2 pb-1 px-1 text-left">
                <DrawerTitle>Opciones de Usuario</DrawerTitle>
                <DrawerDescription className="sr-only">
                  Acciones de perfil y cierre de sesión.
                </DrawerDescription>
              </DrawerHeader>
              <div className="flex flex-col space-y-2 mt-1">
                <Link href="/">
                  {/*
                    Si estos botones también usan SheetClose internamente (a través de SidebarButton),
                    podrían intentar cerrar el Sheet principal, lo cual podría ser confuso.
                    Sería mejor que estos botones dentro del Drawer no intenten cerrar el Sheet.
                    Asumiré que SidebarButton no usa SheetClose si se usa dentro de un Drawer.
                    Si lo hace, necesitaríamos un SidebarButton diferente o una prop para deshabilitar SheetClose.
                  */}
                  <Button // <--- Cambiado de SidebarButton a Button para evitar doble cierre
                    size="sm"
                    variant="ghost" // Para que se parezca al SidebarButton
                    className="w-full justify-start" // Para que se parezca al SidebarButton
                    asChild // Para que funcione con Link
                  >
                    <Link href="/"> {/* O la ruta de configuración correcta */}
                      <Settings className="mr-2 h-4 w-4" /> {/* Añadir icono manualmente */}
                      Configuración
                    </Link>
                  </Button>
                </Link>
                <Button // <--- Cambiado de SidebarButton a Button
                  onClick={() => console.log("Placeholder: Cerrar sesión")}
                  size="sm" 
                  variant="ghost" // Para que se parezca al SidebarButton
                  className="w-full justify-start" // Para que se parezca al SidebarButton
                >
                  <LogOut className="mr-2 h-4 w-4" /> {/* Añadir icono manualmente */}
                  Cerrar sesión
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </SheetContent>
    </Sheet>
  );
}
