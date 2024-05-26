//
"use client";
import { Home } from "lucide-react";
// importamos el componente SidebarDesktop
import { SidebarDesktop } from "./sidebar-desktop";

// Definimos la función Sidebar que devuelve el componente SidebarDesktop
export function Sidebar() {
  return (
    <SidebarDesktop
      sidebarItems={{
        links: [{ label: "Dashboar", href: "/", icon: Home }],
      }}
    />
  );
}
