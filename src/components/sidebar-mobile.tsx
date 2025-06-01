"use client";
import { SidebarItem } from "@/types/sidebar"; // Importación Unificada
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { LogOut, Menu, MoreHorizontal, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarButtonSheet as SidebarButton } from "./sidebar-button";
import { Separator } from "./ui/separator";
import { Drawer, DrawerContent, DrawerTrigger } from "./ui/drawer";
import { Avatar, AvatarFallback } from "./ui/avatar";
// import { signOut, useSession } from "next-auth/react"; // Eliminado

interface SidebarMobileProps {
  sidebarItems: SidebarItem;
}

export function SidebarMobile(props: SidebarMobileProps) {
  const pathname = usePathname();
  // const { data: session } = useSession(); // Eliminado
  const userEmailPlaceholder = "usuario@ejemplo.com";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="fixed top-3 left-3 z-50 sm:hidden"> 
          <Menu size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="px-3 py-4 flex flex-col" hideClose>
        <SheetHeader className="flex flex-row justify-between items-center space-y-0 flex-shrink-0">
          <span className="text-lg font-semibold text-foreground mx-3">
            AccessPoint Control
          </span>
          <SheetClose asChild>
            <Button className="h-7 w-7 p-0" variant="ghost">
              <X size={15} />
            </Button>
          </SheetClose>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto py-5"> {/* Contenido principal con scroll y padding vertical */}
          <div className="flex flex-col w-full gap-1">
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
            {props.sidebarItems.extras}
          </div>
        </div>
        <div className="mt-auto flex-shrink-0"> {/* Sección de usuario al fondo */}
          <Separator className="my-3" /> 
          <Drawer>
            <DrawerTrigger asChild>
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
            </DrawerTrigger>
            <DrawerContent className="mb-2 p-3">
              <div className="flex flex-col space-y-2 mt-2">
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
                  className="w-full">
                  Cerrar sesión
                </SidebarButton>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </SheetContent>
    </Sheet>
  );
}
