import React from "react";
import { ModeToggle } from "./theme-toggle-button"; // Importar ModeToggle aquí

const Header = () => {
  // Eliminado 'fixed'. El posicionamiento se manejará en layout.tsx
  // 'z-10' puede ser útil si hay elementos que podrían solaparse.
  // 'border-b' para una separación visual.
  // 'h-14' para una altura fija (ajusta según necesites).
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b bg-background z-10 flex-shrink-0">
      <div>
        {/* Puedes añadir un logo o título aquí si es necesario */}
        {/* <p className="font-semibold">Panel de Control</p> */}
      </div>
      <div className="flex items-center gap-4">
        {/* Aquí podrías añadir otros elementos del header, como notificaciones o un menú de usuario si no usas el de la sidebar */}
        <ModeToggle />
      </div>
    </header>
  );
};

export default Header;
