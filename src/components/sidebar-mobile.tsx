// src/components/sidebar-mobile.tsx
"use client";
import * as React from 'react';
import { SidebarItem } from "@/types/sidebar"; 
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle, 
  SheetDescription, 
  SheetTrigger,
} from "./ui/sheet"; 
import { Button } from "./ui/button"; 
import { LogOut, Menu, MoreHorizontal, Settings, X, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarButton } from "./sidebar-button"; 
import { Separator } from "./ui/separator";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface SidebarMobileProps {
  sidebarItems: SidebarItem;
}

export function SidebarMobile(props: SidebarMobileProps) {
  const pathname = usePathname();
  const userEmailPlaceholder = "usuario@ejemplo.com";
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="fixed top-3 left-3 z-50 sm:hidden" aria-label="Abrir menú de navegación"> 
          <Menu size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="px-3 py-4 flex flex-col" 
        hideClose
      >
        <SheetHeader className="flex flex-row justify-between items-center space-y-0 flex-shrink-0">
          <SheetTitle className="text-lg font-semibold text-foreground mx-3">
            AccessPoint Control
          </SheetTitle>
          <SheetDescription className="sr-only">
            Menú principal de navegación y opciones de la aplicación.
          </SheetDescription>
          <SheetClose asChild>
            <Button className="h-7 w-7 p-0" variant="ghost" aria-label="Cerrar menú">
              <X size={15} />
            </Button>
          </SheetClose>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto py-5">
          <div className="flex flex-col w-full gap-1">
            {props.sidebarItems.links.map((link, idx) => (
              <SheetClose asChild key={idx}>
                <Link href={link.href} className="block rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none text-left"> 
                  <SidebarButton
                    variant={pathname === link.href ? "secondary" : "ghost"}
                    icon={link.icon}
                  >
                    {link.label}
                  </SidebarButton>
                </Link>
              </SheetClose>
            ))}
            {props.sidebarItems.extras && (
                <SheetClose asChild>
                  {props.sidebarItems.extras}
                </SheetClose>
            )}
          </div>
        </div>
        <div className="mt-auto flex-shrink-0"> 
          <Separator className="my-3" /> 
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="w-full justify-start rounded-full" aria-label="Abrir opciones de usuario">
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
            <PopoverContent 
              className="max-w-[240px] w-auto p-2 mb-2" // MODIFICADO: max-w-[240px] w-auto
              side="top" 
              align="start" 
            >
              <p className="text-sm font-medium px-2 pt-1 pb-2">Opciones de Usuario</p>
              <div className="flex flex-col space-y-1">
                <SheetClose asChild>
                  <Link href="/" className="block rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none text-left">
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setPopoverOpen(false)} 
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Configuración
                    </Button>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Button 
                    onClick={() => {
                      console.log("Placeholder: Cerrar sesión");
                      setPopoverOpen(false); 
                    }}
                    size="sm" 
                    variant="ghost" 
                    className="w-full justify-start" 
                  >
                    <LogOut className="mr-2 h-4 w-4" /> 
                    Cerrar sesión
                  </Button>
                </SheetClose>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </SheetContent> 
    </Sheet> 
  );
}
