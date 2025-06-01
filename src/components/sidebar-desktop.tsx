// Esta es la barra lateral de la aplicación para pantallas de escritorio

// Importa el componente SidebarButton
import { SidebarButton } from "./sidebar-button";
// Importa la interfaz SidebarItem
// import { SidebarItem } from "@/types";
// Define SidebarItem type here if not exported from "@/types"
import type { LucideIcon } from "lucide-react";
export interface SidebarItem {
  links: {
    href: string;
    icon: LucideIcon;
    label: string;
  }[];
  extras?: React.ReactNode;
}
import Link from "next/link";
import { Separator } from "./ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { LogOut, MoreHorizontal, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

// función SidebarDesktop( ) que devuelve un elemento aside con un ancho de 270px, una altura de pantalla completa, posición fija en la parte superior izquierda y un borde derecho
interface SidebarDesktopProps {
  sidebarItems: SidebarItem;
}

export function SidebarDesktop(props: SidebarDesktopProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
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
                <SidebarButton
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  icon={link.icon}
                  className="w-full"
                >
                  {link.label}
                </SidebarButton>
              </Link>
            ))}
            {props.sidebarItems.extras}
          </div>
          <div className="absolute left-0 bottom-3 w-full px-3 ">
            <Separator className="absolute -top-3 left-0 w-full " />
            <Popover>
              <Button
                variant="ghost"
                className="w-full justify-start rounded-full"
              >
                <PopoverTrigger asChild>
                  <div className="flex justify-between items-center w-full ">
                    <div className="flex gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={session?.user?.image ?? ''} alt="avatar" />
                        <AvatarFallback>
                          {session?.user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{session?.user?.email}</span>
                    </div>
                    <MoreHorizontal size={20} />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="mb-2 w-56 p-3 rounded-[1rem]">
                  <div className="space-y-1">
                    <Link href="/">
                      <SidebarButton
                        size="sm"
                        icon={Settings}
                        className="w-full"
                      >
                        Configuración
                      </SidebarButton>
                    </Link>
                    <SidebarButton onClick={() => signOut()}
                    size="sm" icon={LogOut} className="w-full">
                      Cerrar sesión
                    </SidebarButton>
                  </div>
                </PopoverContent>
              </Button>
            </Popover>
          </div>
        </div>
      </div>
    </aside>
  );
}
