// Esta es la barra lateral de la aplicación para pantallas de escritorio

// Importa el componente SidebarButton
import { SidebarButton } from "./sidebar-button";
// Importa la interfaz SidebarItem
import { SidebarItem } from "@/types";
import Link from "next/link";
import { Separator } from "./ui/separator";
import { Popover } from "./ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { MoreHorizontal } from "lucide-react";
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
                <SidebarButton icon={link.icon} className="w-full">
                  {link.label}
                </SidebarButton>
              </Link>
            ))}
            {props.sidebarItems.extras}
          </div>
          <div className="absolute left-0 bottom-3 w-full px-3">
            <Separator className="absolute -top-3 left-0 w-full" />
            <Button variant="ghost" className="w-full justify-start">
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex justify-between items-center w-full">
                    <div className="flex gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src="https://github.com/Jerkzaen.png" />
                        <AvatarFallback>Jerson Armijo</AvatarFallback>
                      </Avatar>
                      <span>Jerson Armijo</span>
                    </div>
                    <MoreHorizontal size={20} />
                  </div>
                </PopoverTrigger>
              </Popover>
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
