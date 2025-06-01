import { SidebarButton } from "./sidebar-button";
import { SidebarItem } from "@/types/sidebar"; // Importación Unificada
import Link from "next/link";
import { Separator } from "./ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { LogOut, MoreHorizontal, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
// import { signOut, useSession } from "next-auth/react"; // Eliminado

interface SidebarDesktopProps {
  sidebarItems: SidebarItem;
}

export function SidebarDesktop(props: SidebarDesktopProps) {
  const pathname = usePathname();
  // const { data: session } = useSession(); // Eliminado
  // Placeholder para datos de usuario si los necesitas para la UI
  const userEmailPlaceholder = "usuario@ejemplo.com"; 

  return (
    <aside className="w-[270px] max-w-xs h-screen fixed left-0 top-0 z-40 border-r bg-background flex flex-col">
      <div className="h-full px-3 py-4 flex flex-col"> {/* Contenedor principal de la sidebar */}
        {/* Sección superior: Título y links de navegación */}
        <div className="flex-shrink-0">
          <h3 className="mx-3 text-lg font-semibold text-foreground">
            AccessPoint Control
          </h3>
          <div className="mt-5">
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
          </div>
        </div>

        {/* Sección inferior: Perfil y acciones de usuario (empujado al fondo) */}
        <div className="mt-auto w-full pt-4"> {/* mt-auto para empujar al fondo, pt-4 para espacio */}
          <Separator className="mb-3" />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="w-full justify-start rounded-full">
                <div className="flex justify-between items-center w-full">
                  <div className="flex gap-2 items-center">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback>{userEmailPlaceholder.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{userEmailPlaceholder}</span>
                  </div>
                  <MoreHorizontal size={20} />
                </div>
              </Button>
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
                <SidebarButton
                  onClick={() => console.log("Placeholder: Cerrar sesión")}
                  size="sm"
                  icon={LogOut}
                  className="w-full"
                >
                  Cerrar sesión
                </SidebarButton>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </aside>
  );
}
