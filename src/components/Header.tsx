// src/components/Header.tsx
import React from "react";
import { ModeToggle } from "./theme-toggle-button";
import { ClientOnly } from "./ClientOnly"; // Asegúrate que la ruta sea correcta
import { Button } from "@/components/ui/button"; // Importar Button
import { Settings } from "lucide-react"; // Para el icono del placeholder

const Header = () => {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b bg-background flex-shrink-0">
      <div>
        {/* Espacio para un logo o título global de la aplicación si es necesario */}
      </div>
      <div className="flex items-center gap-4">
        <ClientOnly 
          fallback={
            // Usar un Button como fallback, ya que ModeToggle renderiza un Button como trigger
            <Button variant="outline" size="icon" disabled aria-hidden="true">
              <Settings className="h-[1.2rem] w-[1.2rem] opacity-50" />
            </Button>
          }
        >
          <ModeToggle />
        </ClientOnly>
      </div>
    </header>
  );
};

export default Header;
