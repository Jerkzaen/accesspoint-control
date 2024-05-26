//  use cliente es una directiva que indica que se va a usar el cliente para 
//renderizar el componente Sidebar y SidebarDesktop en el navegador y no en el servidor de la aplicación de Next.js   
"use client";
// Importamos el componente Home de lucide-react
import { Home } from "lucide-react";
// importamos el componente SidebarDesktop
import { SidebarDesktop } from "./sidebar-desktop";
import { SidebarItem } from "@/types";

const sidebarItems: SidebarItem = { links: [{ href: "/", label: "Home", icon: Home }] };

// Definimos la función Sidebar que devuelve el componente SidebarDesktop       
export function Sidebar() {
  return (
    <SidebarDesktop
      sidebarItems={sidebarItems}
    />
  );
}
