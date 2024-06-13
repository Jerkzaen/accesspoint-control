"use client";
// Importamos sidebarItem de la interfaz SidebarItem
import { SidebarItem } from "@/types";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";

// función SidebarDesktop( ) que devuelve un elemento aside con un ancho de 270px, una altura de pantalla completa, posición fija en la parte superior izquierda y un borde derecho
interface SidebarDesktopProps {
  sidebarItems: SidebarItem;
}

//
export function SidebarMobile(props: SidebarDesktopProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>
         Open Sidebar
        </Button>
      </SheetTrigger>
      <SheetContent> 
        Sidebar Content
      </SheetContent>
    </Sheet>
  );
}
