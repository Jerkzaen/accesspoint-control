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
        import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
        // import { signOut, useSession } from "next-auth/react"; // Eliminado

        interface SidebarMobileProps {
          sidebarItems: SidebarItem;
        }

        export function SidebarMobile(props: SidebarMobileProps) {
          const pathname = usePathname();
          // const { data: session } = useSession(); // Eliminado
          const session = null; // Placeholder

          return (
            <Sheet>
              <SheetTrigger asChild>
                {/* Ajustado para mejor visibilidad y para ocultarse en pantallas más grandes que 'sm' */}
                <Button size="icon" variant="ghost" className="fixed top-3 left-3 z-50 sm:hidden"> 
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="px-3 py-4" hideClose>
                <SheetHeader className="flex flex-row justify-between items-center space-y-0">
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
                      <DrawerTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start rounded-full">
                          <div className="flex justify-between items-center w-full">
                            <div className="flex gap-2 items-center">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback>U</AvatarFallback>
                              </Avatar>
                              <span>usuario@ejemplo.com</span>
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
                            onClick={() => console.log("Cerrar sesión placeholder")}
                            size="sm" 
                            icon={LogOut} 
                            className="w-full">
                            Cerrar sesión
                          </SidebarButton>
                        </div>
                      </DrawerContent>
                    </Drawer>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          );
        }
        