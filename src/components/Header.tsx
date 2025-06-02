// src/components/Header.tsx
import React from "react";
import { ModeToggle } from "./theme-toggle-button";
import { ClientOnly } from "./ClientOnly"; // Asegúrate que la ruta sea correcta

const Header = () => {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b bg-background flex-shrink-0">
      <div>
        {/* Espacio para un logo o título global de la aplicación si es necesario */}
      </div>
      <div className="flex items-center gap-4">
        <ClientOnly fallback={<div style={{ width: '2.5rem', height: '2.5rem' }} /> /* Placeholder simple */}>
          <ModeToggle />
        </ClientOnly>
      </div>
    </header>
  );
};

export default Header;
