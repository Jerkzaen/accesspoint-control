// Esta es la barra lateral de la aplicación para pantallas de escritorio
import { Home } from "lucide-react";
// Importa el componente SidebarButton
import { SidebarButton } from "./sidebar-button";
// Importa la interfaz SidebarItem
import { SidebarItem } from "@/types";
import Link from "next/link";
// función SidebarDesktop( ) que devuelve un elemento aside con un ancho de 270px, una altura de pantalla completa, posición fija en la parte superior izquierda y un borde derecho

interface SidebarDesktopProps {
  sidebarItems: SidebarItem;
}

export function SidebarDesktop(props: SidebarDesktopProps) {
  return (
    <aside className="w-[270px] max-w-xs h-screen fixed left-0 top-0 z-40 border-r ">
      <div className="h-full px-3 py-4">
        <h3 className="mx-3 text-lg font-semibold text-foreground">
          AccessPoint Control
        </h3>
        <div className="mt-5 ">
          <div className="flex flex-col gap-1 w-full">
            {props.sidebarItems.links.map((link, index) => (
              <Link key={index} href={link.href}>
                <SidebarButton icon={link.icon} className="w-full" >{link.label}</SidebarButton>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
