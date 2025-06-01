"use client";
// import { SidebarItem } from "@/types"; // Comentado si causa error y no está definido en @/types
import type { LucideIcon } from "lucide-react";
// TODO: Replace 'any' with the correct type if available in '@/types'
type SidebarItem = {
  links: { href: string; icon: LucideIcon; label: string }[];
  extras?: React.ReactNode;
};
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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
// import { signOut, useSession } from "next-auth/react"; // Comentado temporalmente

interface SidebarMobileProps {
  sidebarItems: SidebarItem;
}

export function SidebarMobile(props: SidebarMobileProps) {
  const pathname = usePathname();
  // const { data: session } = useSession(); // Comentado temporalmente
  const session = null; // Placeholder

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="fixed left-3 z-20">
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
        <div className="h-full">
          <div className="mt-5 flex flex-col w-full gap-1">
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
          <div className="absolute w-full bottom-4 px-1 left-0">
            <Separator className="absolute -top-3 left-0 w-full" /> 
            <Drawer>
              <Button
                variant="ghost"
                className="w-full justify-start rounded-full"
              >
                <DrawerTrigger asChild>
                  <div className="flex justify-between items-center w-full ">
                    <div className="flex gap-2">
                      <Avatar className="h-5 w-5">
                        {/* <AvatarImage src={session?.user?.image ?? ''} alt="avatar" /> */}
                        <AvatarFallback>
                          {/* {session?.user?.email?.charAt(0).toUpperCase()} */}
                          U {/* Placeholder */}
                        </AvatarFallback>
                      </Avatar>
                      {/* <span>{session?.user?.email}</span> */}
                      <span>usuario@ejemplo.com</span> {/* Placeholder */}
                    </div>
                    <MoreHorizontal size={20} />
                  </div>
                </DrawerTrigger>
                <DrawerContent className="mb-2  p-3">
                  <div className="sflex flex-col space-y-2 mt-2">
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
                      // onClick={() => signOut()} // Comentado temporalmente
                      onClick={() => console.log("Cerrar sesión clickeado")} // Placeholder
                      size="sm" 
                      icon={LogOut} 
                      className="w-full">
                      Cerrar sesión
                    </SidebarButton>
                  </div>
                </DrawerContent>
              </Button>
            </Drawer>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
