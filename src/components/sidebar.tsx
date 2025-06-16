// src/components/sidebar.tsx
"use client";
import {
  Bell,
  Box,
  Cpu,
  Home,
  Monitor,
  User,
  Upload,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { SidebarDesktop } from "./sidebar-desktop";
import { SidebarItem } from "@/types/sidebar"; 
import { SidebarButton } from "./sidebar-button";
import Link from "next/link";
import { useMediaQuery } from "usehooks-ts";
import { SidebarMobile } from "./sidebar-mobile";
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { RoleUsuario } from "@prisma/client";
import { usePathname } from 'next/navigation';

export default function Sidebar() { 
  const [mounted, setMounted] = useState(false);
  const isDesktopClient = useMediaQuery("(min-width: 768px)");
  const { data: session } = useSession();
  const pathname = usePathname();

  const userRole = (session?.user as any)?.rol;

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

  const adminLinks = [];
  if (userRole === RoleUsuario.ADMIN) {
    adminLinks.push(
      // CORRECCIÓN FINAL: Apuntar a la nueva ruta simplificada
      { label: "Carga Masiva", href: "/admin/carga-masiva", icon: Upload },
      { label: "Empresas", href: "/admin/empresas", icon: Box },
      { label: "Sucursales", href: "/admin/sucursales", icon: Box },

      { label: "Geografía", href: "/admin/geografia", icon: MapPin } // Añadido enlace a Geografía
    );
  }
  
  const finalSidebarItems: SidebarItem = {
    ...sidebarItemsDefinition,
    links: [...sidebarItemsDefinition.links],
  };
  
  if (adminLinks.length > 0) {
    const adminGroup = (
      <div key="admin-group" className="mt-4">
        <h4 className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Administración</span>
        </h4>
        <div className="flex flex-col gap-1 w-full">
          {adminLinks.map((link, index) => (
            <Link key={`admin-${index}`} href={link.href}>
              <SidebarButton
                variant={pathname === link.href ? "secondary" : "ghost"}
                icon={link.icon}
                className="w-full"
              >
                {link.label}
              </SidebarButton>
            </Link>
          ))}
        </div>
      </div>
    );
    finalSidebarItems.extras = (
      <>
        {sidebarItemsDefinition.extras}
        {adminGroup}
      </>
    );
  }

  useEffect(() => {
    setMounted(true);
  }, []); 

  if (!mounted) {
    return (
      <aside 
        style={{ width: '270px', flexShrink: 0 }} 
        aria-hidden="true" 
      />
    );
  }
 
  if (isDesktopClient) {
    return <SidebarDesktop sidebarItems={finalSidebarItems} />;
  }
  return <SidebarMobile sidebarItems={finalSidebarItems} />;
}
