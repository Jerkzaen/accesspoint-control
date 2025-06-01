"use client";
import {
  Bell,
  Box,
  Cpu,
  Home,
  Monitor,
  User,
} from "lucide-react";
import { SidebarDesktop } from "./sidebar-desktop";
import { SidebarItem } from "@/types/sidebar"; // Importación Unificada
import { SidebarButton } from "./sidebar-button";
import Link from "next/link";
import { useMediaQuery } from "usehooks-ts";
import { SidebarMobile } from "./sidebar-mobile";
import { useState, useEffect } from 'react'; // Importaciones necesarias

const sidebarItemsDefinition: SidebarItem = {
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

export function Sidebar() {
  const isDesktopQuery = useMediaQuery("(min-width: 768px)"); // md breakpoint
  const [isDesktop, setIsDesktop] = useState(false); // Estado para evitar flash
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Sincronizar el estado con el query una vez montado en el cliente
    setIsDesktop(isDesktopQuery); 
  }, [isDesktopQuery]); // Volver a ejecutar si el query cambia (resize)

  if (!mounted) {
    // Durante SSR o antes de la primera hidratación, puedes retornar null o un esqueleto
    // para evitar el flash de la versión incorrecta.
    return null; 
  }
 
  if (isDesktop) {
    return <SidebarDesktop sidebarItems={sidebarItemsDefinition} />;
  }
  return <SidebarMobile sidebarItems={sidebarItemsDefinition} />;
}
