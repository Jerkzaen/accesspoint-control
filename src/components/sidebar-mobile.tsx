// src/components/sidebar-mobile.tsx
"use client";
import { SidebarItem } from "@/types/sidebar"; 
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle, // <--- IMPORTADO
  SheetDescription, // <--- IMPORTADO
  SheetTrigger,
} from "./ui/sheet"; // Asegúrate que la ruta a ui/sheet sea correcta
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
  DrawerHeader, // <--- IMPORTADO
  DrawerTitle, // <--- IMPORTADO
  DrawerDescription // <--- IMPORTADO
} from "./ui/drawer"; // Asegúrate que la ruta a ui/drawer sea correcta
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
        <SheetHeader className="flex flex-row justify-between items-center space-y-0 flex-shrink-0">
          {/* Título y Descripción para el Sheet (principalmente para accesibilidad) */}
          <SheetTitle className="text-lg font-semibold text-foreground mx-3">
            AccessPoint Control
          </SheetTitle>
          {/* SheetDescription puede estar oculta visualmente si no se necesita */}
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
              {/* Envolver título y descripción en DrawerHeader */}
              <DrawerHeader className="pt-2 pb-1 px-1 text-left">
                <DrawerTitle>Opciones de Usuario</DrawerTitle>
                <DrawerDescription className="sr-only">
                  Acciones de perfil y cierre de sesión.
                </DrawerDescription>
              </DrawerHeader>
              <div className="flex flex-col space-y-2 mt-1">
                <Link href="/">
                  <SidebarButton
                    size="sm"
                    icon={Settings}
                    className="w-full"
                  >
                    Configuración
                  </SidebarButton>
                </Link>
                <SidebarButton 
                  onClick={() => console.log("Placeholder: Cerrar sesión")}
                  size="sm" 
                  icon={LogOut} 
                  className="w-full">
                  Cerrar sesión
                </SidebarButton>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </SheetContent>
    </Sheet>
  );
}
