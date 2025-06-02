// src/components/sidebar.tsx
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
import { SidebarItem } from "@/types/sidebar"; 
import { SidebarButton } from "./sidebar-button";
import Link from "next/link";
import { useMediaQuery } from "usehooks-ts";
import { SidebarMobile } from "./sidebar-mobile";
import { useState, useEffect } from 'react';

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
  const isDesktopQuery = useMediaQuery("(min-width: 768px)");
  const [isDesktop, setIsDesktop] = useState(false); 
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDesktop(isDesktopQuery); 
  }, [isDesktopQuery]); 

  if (!mounted) {
    // Retornar un placeholder div con el ancho esperado para evitar CLS y problemas de hidratación.
    // El SidebarDesktop tiene un ancho de 270px.
    // Este div debe ser estructuralmente similar a lo que SidebarDesktop/Mobile renderizarían como raíz si es un div.
    // Si SidebarDesktop/Mobile renderizan <aside>, entonces este debería ser <aside> también.
    // Asumiendo que SidebarDesktop renderiza un <aside className="w-[270px]...">
    return <aside className="w-[270px] h-screen fixed left-0 top-0 z-40 border-r bg-background flex-shrink-0" aria-hidden="true" />;
    // O un div más simple si no se quiere replicar toda la estructura:
    // return <div style={{ width: '270px' }} aria-hidden="true" />;
  }
 
  if (isDesktop) {
    return <SidebarDesktop sidebarItems={sidebarItemsDefinition} />;
  }
  return <SidebarMobile sidebarItems={sidebarItemsDefinition} />;
}
