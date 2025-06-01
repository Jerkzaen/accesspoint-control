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
        // Importamos la interfaz SidebarItem desde el archivo centralizado
        import { SidebarItem } from "@/types/sidebar"; // Ajusta la ruta si es necesario
        import { SidebarButton } from "./sidebar-button";
        import Link from "next/link";
        import { useMediaQuery } from "usehooks-ts";
        import { SidebarMobile } from "./sidebar-mobile";

        const sidebarItemsDefinition: SidebarItem = {
          links: [
            { label: "Dashboard", href: "/", icon: Home },
            { label: "Ticket de soporte", href: "/tickets/dashboard", icon: Bell },
            { label: "AccessPoint", href: "/accesspoint/new", icon: Monitor },
            { label: "WTS", href: "/item/perfil", icon: Cpu }, // Asumo que esta ruta existe
            { label: "Bodega", href: "/bodega/new", icon: Box }, // Asumo que esta ruta existe
          ],
          extras: (
            <div className="flex flex-col gap-2">
              <Link href="/profile"> {/* Asumo que esta ruta existe */}
                <SidebarButton icon={User} variant="ghost" className="w-full">
                  Perfil
                </SidebarButton>
              </Link>
            </div>
          ),
        };

        export function Sidebar() {
          const isDesktop = useMediaQuery("(min-width: 768px)", { // Ajustado a 768px (sm/md breakpoint)
            initializeWithValue: false,
          });
        
          if (isDesktop) {
            return <SidebarDesktop sidebarItems={sidebarItemsDefinition} />;
          }
          return <SidebarMobile sidebarItems={sidebarItemsDefinition} />;
        }
        