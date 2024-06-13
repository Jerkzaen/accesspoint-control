//  use cliente es una directiva que indica que se va a usar el cliente para
//renderizar el componente Sidebar y SidebarDesktop en el navegador y no en el servidor de la aplicación de Next.js
"use client";
// Importamos el componente Home de lucide-react
import {
  Bell,
  Box,
  Cpu,
  Home,
  Monitor,
  MoreHorizontal,
  PanelBottom,
  User,
} from "lucide-react";
// importamos el componente SidebarDesktop
import { SidebarDesktop } from "./sidebar-desktop";
// Importamos la interfaz SidebarItem
import { SidebarItem } from "@/types";
// Importamos el componente SidebarButton
import { SidebarButton } from "./sidebar-button";
// Importamos el componente Link de next
import Link from "next/link";
// Importamos el hook useMediaQuery de usehooks-ts para definir un media query en el componente Sidebar
import { useMediaQuery } from "usehooks-ts";
import { SidebarMobile } from "./sidebar-mobile";

// Definimos el objeto sidebarItems que contiene un arreglo de links con un objeto que contiene un href y un label
const sidebarItems: SidebarItem = {
  links: [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Ticket de soporte", href: "/tickets/dashboard", icon: Bell },
    { label: "AccessPoint", href: "/accesspoint/new", icon: Monitor },
    { label: "WTS", href: "/item/perfil", icon: Cpu },
    { label: "Bodega", href: "/bodega/new", icon: Box },
  ],
  extras: (
    <div className="flex flex-col gap-2">
      <Link href="/profile">
        <SidebarButton icon={User} variant="ghost" className="w-full">
          Perfil
        </SidebarButton>
      </Link>
    </div>
  ),
};

// Definimos la función Sidebar que devuelve el componente SidebarDesktop
export function Sidebar() {
  // Definimos el hook useMediaQuery que recibe un media query y un valor booleano
  const isDesktop = useMediaQuery("(min-width: 640px)");
  // Si el valor de isDesktop es verdadero, se renderiza el componente SidebarDesktop
  if (isDesktop) {
    return <SidebarDesktop sidebarItems={sidebarItems} />;
  }
  // Si el valor de isDesktop es falso, se renderiza un div vacío
  return <SidebarMobile sidebarItems={sidebarItems} />;
}
