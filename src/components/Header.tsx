import React from "react";
import { ModeToggle } from "./theme-toggle-button";
// import Navbar from "./navbar"; // Navbar.tsx parece redundante si ModeToggle está aquí

const Header = () => {
  // Este Header se posicionará por el layout padre.
  // 'h-14' (56px) es una altura común para cabeceras.
  // 'flex-shrink-0' para que no se encoja si el contenido principal es muy grande.
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b bg-background z-10 flex-shrink-0">
      <div>
        {/* Espacio para un logo o título si es necesario */}
        {/* <h1 className="text-xl font-semibold">AccessPoint Control</h1> */}
      </div>
      <div className="flex items-center gap-4">
        {/* Aquí podrían ir otros íconos o elementos del header */}
        <ModeToggle />
      </div>
    </header>
  );
};

export default Header;