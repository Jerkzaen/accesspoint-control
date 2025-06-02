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
  const [mounted, setMounted] = useState(false);
  // isDesktopClient solo se usará después de que mounted sea true.
  const isDesktopClient = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    setMounted(true);
  }, []); 

  if (!mounted) {
    // Placeholder que coincide con la etiqueta raíz de SidebarDesktop (<aside>)
    // y tiene estilos inline básicos para el ancho.
    return (
      <aside 
        style={{ width: '270px', flexShrink: 0 }} 
        aria-hidden="true" 
      />
    );
  }
 
  // Renderizado solo en el cliente, después de que 'mounted' es true.
  if (isDesktopClient) {
    return <SidebarDesktop sidebarItems={sidebarItemsDefinition} />;
  }
  return <SidebarMobile sidebarItems={sidebarItemsDefinition} />;
}
