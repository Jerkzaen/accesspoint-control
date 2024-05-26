//  use cliente es una directiva que indica que se va a usar el cliente para
//renderizar el componente Sidebar y SidebarDesktop en el navegador y no en el servidor de la aplicación de Next.js
"use client";
// Importamos el componente Home de lucide-react
import { Bell, Home, User } from "lucide-react";
// importamos el componente SidebarDesktop
import { SidebarDesktop } from "./sidebar-desktop";
import { SidebarItem } from "@/types";
// Definimos el objeto sidebarItems que contiene un arreglo de links con un objeto que contiene un href y un label
const sidebarItems: SidebarItem = {
  links: [
    {label: "Dashboard", href: "/" , icon: Home },
    {label: "Notificaciones", href: "/item/notificacion" , icon: Bell },
    {label: "Perfil", href: "/item/perfil" , icon: User }

],
};

// Definimos la función Sidebar que devuelve el componente SidebarDesktop
export function Sidebar() {
  return <SidebarDesktop sidebarItems={sidebarItems} />;
}
