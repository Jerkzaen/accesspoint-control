// Esta es la barra lateral de la aplicación para pantallas de escritorio
import { Home } from "lucide-react";
// Importa el componente SidebarButton
import { SidebarButton } from "./sidebar-button";
// función SidebarDesktop( ) que devuelve un elemento aside con un ancho de 270px, una altura de pantalla completa, posición fija en la parte superior izquierda y un borde derecho

interface SidebarDesktopProps {
    sidebarItems: SidebarItem[]; 
}

export function SidebarDesktop() {   
     return (
        <aside className='w-[270px] max-w-xs h-screen fixed left-0 top-0 z-40 border-r '>
            <div className="h-full px-3 py-4">
                <h3 className="mx-3 text-lg font-semibold text-foreground">
                    AccessPoint Control
                </h3>
                <div className="mt-5 ">
                    <div className="flex flex-col gap-1 w-full">
                        <SidebarButton icon={Home}> Panel de control </SidebarButton>
                        <SidebarButton/>
                        <SidebarButton/>

                    </div>

                </div>

            </div>
    
        </aside>
    )}