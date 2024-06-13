"use client";
// Importamos sidebarItem de la interfaz SidebarItem
import { SidebarItem } from "@/types";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { SidebarButton } from "./sidebar-button";
import { usePathname } from "next/navigation";

// función SidebarDesktop( ) que devuelve un elemento aside con un ancho de 270px, una altura de pantalla completa, posición fija en la parte superior izquierda y un borde derecho
interface SidebarMobileProps {
  sidebarItems: SidebarItem;
}

// Definimos la función SidebarMobile que recibe un objeto sidebarItems y devuelve un componente Sheet
export function SidebarMobile(props: SidebarMobileProps) {
  const pathname = usePathname();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="fixed top-3 left-3">
          <Menu size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="px-3 py-4" hideClose>
        <SheetHeader
          className="flex flex-row justify-between
        items-center space-y-0"
        >
          <span className="text-lg font-semibold text-foreground mx-3">
            AccessPoint Control
          </span>
          <SheetClose asChild>
            <Button className="h-7 w-7 p-0" variant="ghost">
              <X size={15} />
            </Button>
          </SheetClose>
        </SheetHeader>
        <div>
          <div>
            {props.sidebarItems.links.map((link, idx) => (
              <Link key={idx} href={link.href}>
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
      </SheetContent>
    </Sheet>
  );
}
