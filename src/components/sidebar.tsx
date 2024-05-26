//  use cliente es una directiva que indica que se va a usar el cliente para
//renderizar el componente Sidebar y SidebarDesktop en el navegador y no en el servidor de la aplicación de Next.js
"use client";
// Importamos el componente Home de lucide-react
import { Bell, Home, MoreHorizontal, User } from "lucide-react";
// importamos el componente SidebarDesktop
import { SidebarDesktop } from "./sidebar-desktop";
// Importamos la interfaz SidebarItem
import { SidebarItem } from "@/types";
// Importamos el componente SidebarButton
import { SidebarButton } from "./sidebar-button";
//
import Link from "next/link";

// Definimos el objeto sidebarItems que contiene un arreglo de links con un objeto que contiene un href y un label
const sidebarItems: SidebarItem = {
  links: [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Notificaciones", href: "/item/notificacion", icon: Bell },
    { label: "Perfil", href: "/item/perfil", icon: User },
  ],
  extras: (
    <div className="flex flex-col gap-2">
      <SidebarButton icon={MoreHorizontal} className="w-full">
        Mas
      </SidebarButton>
      <SidebarButton className="w-full justify-center " variant="default">
        <Link href="tickets/new"> Nuevo Ticket </Link>
      </SidebarButton>
    </div>
  ),
};

// Definimos la función Sidebar que devuelve el componente SidebarDesktop
export function Sidebar() {
  return <SidebarDesktop sidebarItems={sidebarItems} />;
}
