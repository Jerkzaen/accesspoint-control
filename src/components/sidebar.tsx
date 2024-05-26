//  use cliente es una directiva que indica que se va a usar el cliente para 
//renderizar el componente Sidebar y SidebarDesktop en el navegador y no en el servidor de la aplicación de Next.js   
"use client";
// Importamos el componente Home de lucide-react
import { Home } from "lucide-react";
// importamos el componente SidebarDesktop
import { SidebarDesktop } from "./sidebar-desktop";

// Definimos la función Sidebar que devuelve el componente SidebarDesktop       
export function Sidebar() {
  return (
    <SidebarDesktop
      sidebarItems={{
        links: [{ label: "Dashboard", href: "/", icon: Home }],
      }}
    />
  );
}
