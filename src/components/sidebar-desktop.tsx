// Esta es la barra lateral de la aplicación para pantallas de escritorio
        import { SidebarButton } from "./sidebar-button";
        // Update the import path below to the correct relative path if "@/types/sidebar" does not exist.
        // Example: import { SidebarItem } from "../types/sidebar";
        import { SidebarItem } from "@/types/sidebar"; // Importación Unificada
        import Link from "next/link";
        import { Separator } from "./ui/separator";
        import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
        import { Button } from "./ui/button";
        import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
        import { LogOut, MoreHorizontal, Settings } from "lucide-react";
        import { usePathname } from "next/navigation";
        // import { signOut, useSession } from "next-auth/react"; // Eliminado

        interface SidebarDesktopProps {
          sidebarItems: SidebarItem;
        }

        export function SidebarDesktop(props: SidebarDesktopProps) {
          const pathname = usePathname();
          // const { data: session } = useSession(); // Eliminado
          const session = null; // Placeholder o lógica alternativa si es necesaria

          return (
            <aside className="w-[270px] max-w-xs h-screen fixed left-0 top-0 z-40 border-r bg-background"> {/* Añadido bg-background */}
              <div className="h-full px-3 py-4">
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
                  <div className="absolute left-0 bottom-3 w-full px-3">
                    <Separator className="absolute -top-3 left-0 w-full" />
                    <Popover>
                      <PopoverTrigger asChild>
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
                            onClick={() => console.log("Cerrar sesión placeholder")}
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
              </div>
            </aside>
          );
        }
        